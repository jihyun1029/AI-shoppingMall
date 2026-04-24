import { parseRagKeywords } from './keywordParser.js'
import {
  hybridSearch,
  searchByCartContext,
  searchConstrainedFallback,
  searchPopularFallback,
  searchRelaxedBlob,
} from './searchService.js'
import { filterByHardConstraints, rerank } from './rankingService.js'
import { validateCandidates } from './validationService.js'
import { rowToApiProduct } from '../productRowMapper.js'

const TOP_K = 12
const FINAL_N = 5

/**
 * @param {object[]} products
 * @param {ReturnType<typeof parseRagKeywords>} f
 * @param {{ usedFallback?: boolean }} meta
 */
function generateAdvancedReply(products, f, meta) {
  const minLabel = f.minPriceOp === '초과' ? '초과' : '이상'
  const maxLabel = f.maxPriceOp === '미만' ? '미만' : '이하'
  if (!products.length) {
    if (f.colors?.length) {
      const colorWord = f.colorLabel || f.color || '요청하신 컬러'
      const itemHint = (() => {
        if (f.subCategories?.length) return f.subCategories[0]
        if (f.categories?.[0] === 'bag') return '가방'
        return '상품'
      })()
      return `요청하신 ${colorWord} ${itemHint} 조합은 현재 등록된 상품이 없어요 😢 색상 조건을 조금 완화해서 다시 검색해 보시겠어요?`
    }
    const parts = []
    if (f.minPrice != null) parts.push(`${Math.round(f.minPrice / 10000)}만원 ${minLabel}`)
    if (f.maxPrice != null) parts.push(`${Math.round(f.maxPrice / 10000)}만원 ${maxLabel}`)
    const price = parts.length ? `${parts.join(' ')} ` : ''
    const category = f.categories?.[0] === 'bag' ? '가방' : '요청하신'
    return `${price}${category} 상품은 현재 조건에 맞는 상품이 없어요. 가격 조건을 조정하거나 다른 카테고리로 검색해보세요.`
  }

  if (meta.usedFallback) {
    return '조건 안에서 후보가 적어, 같은 조건의 인기 상품 위주로 추천드릴게요 😊'
  }

  const styleLine = (() => {
    switch (f.styleKeyword) {
      case 'office':
        return '출근룩에는 깔끔한 블라우스와 슬랙스 조합이 잘 어울려요.'
      case 'daily':
        return '데일리룩은 편하지만 정돈된 실루엣이 포인트예요.'
      case 'date':
        return '데이트에는 분위기 있게 라인이 살아 보이는 아이템이 좋아요.'
      case 'feminine':
        return '페미닌 무드는 소재 광택과 컬러 톤으로 은은하게 살리면 좋아요.'
      case 'casual':
        return '캐주얼은 데님·스니커즈 매치가 자연스럽고 활동성도 좋아요.'
      default:
        return '요청하신 조건에 맞춰 어울리는 상품을 골라봤어요.'
    }
  })()

  const first = products[0]
  const firstLabel = `${first.brand} ${first.name}`
  const colorPhrase = f.colorLabel || f.color || (f.colors?.length ? f.colors[0] : '')
  const reason =
    f.colors?.length > 0
      ? `${firstLabel}는 말씀하신 ${colorPhrase} 톤과 잘 어울려요.`
      : `${firstLabel}는 지금 조건에서 활용도가 특히 좋아요.`

  const priceHintParts = []
  if (f.minPrice != null) priceHintParts.push(`${Math.round(f.minPrice / 10000)}만 원 ${minLabel}`)
  if (f.maxPrice != null) priceHintParts.push(`${Math.round(f.maxPrice / 10000)}만 원 ${maxLabel}`)
  const priceHint = priceHintParts.length ? ` 가격은 ${priceHintParts.join(' · ')} 조건을 반영했어요.` : ''
  const categoryHint =
    f.categories?.[0] === 'bag'
      ? '가방을 찾고 계시군요. 조건에 맞는 가방 상품을 추천해드릴게요.'
      : ''

  const others = products
    .slice(1, 4)
    .map((p) => `${p.brand} ${p.name}`)
    .join(', ')
  const more = others ? ` 추가로 ${others}도 함께 보면 좋아요.` : ''

  return `${categoryHint} ${styleLine}${priceHint} ${reason}${more} 29CM / W컨셉 무드로 미니멀하게 코디해 보세요 😊`
}

/**
 * 고급 RAG: Hybrid 검색 → Rerank → Validation → 템플릿 응답
 * @param {import('better-sqlite3').Database} db
 * @param {string} message
 * @param {{ cartProductIds?: string[] }} [opts]
 */
export function runRagChat(db, message, opts = {}) {
  const f = parseRagKeywords(message)
  let candidates = hybridSearch(db, f)
  if (candidates.length < 6) {
    const extra = searchRelaxedBlob(db, f)
    const m = new Map()
    for (const r of [...candidates, ...extra]) {
      if (r?.id != null) m.set(r.id, r)
    }
    candidates = [...m.values()]
  }
  candidates = filterByHardConstraints(candidates, f)

  let ranked = rerank(candidates, f)
  let slice = ranked.slice(0, TOP_K)
  let { rows: valid } = validateCandidates(db, slice, f)

  if (opts.cartProductIds?.length && valid.length < 3) {
    const extra = searchByCartContext(db, opts.cartProductIds, f)
    const merged = rerank(filterByHardConstraints([...valid, ...extra], f), f)
    slice = merged.slice(0, TOP_K)
    valid = validateCandidates(db, slice, f).rows
  }

  let usedFallback = false
  if (valid.length === 0) {
    if (f.colors?.length) {
      // 색상은 필수 조건: 다른 컬러로 채우는 fallback 금지
    } else {
      const constrained = searchConstrainedFallback(db, f)
      if (constrained.length > 0) {
        ranked = rerank(constrained, f)
        valid = validateCandidates(db, ranked.slice(0, TOP_K), f).rows
        usedFallback = true
      } else if (!f.categories?.length && f.minPrice == null && f.maxPrice == null) {
        const pop = searchPopularFallback(db)
        ranked = rerank(pop, f)
        valid = validateCandidates(db, ranked.slice(0, TOP_K), f, { strictCategory: false }).rows
        usedFallback = true
      }
    }
  }

  const finalRanked = rerank(valid, f)
  const products = finalRanked.slice(0, FINAL_N).map(rowToApiProduct)
  const text = generateAdvancedReply(products, f, { usedFallback })
  return { text, products }
}
