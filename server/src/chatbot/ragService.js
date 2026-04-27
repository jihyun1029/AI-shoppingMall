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
import { generateOverallReplyIntro } from './recommendReasonService.js'

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
    const cw = f.colorLabel || f.color
    const sub = f.strictSubCategory
    if (sub && cw) {
      return `${cw} ${sub} 상품은 현재 조건에 맞는 상품이 없어요. 색상이나 다른 조건을 완화해서 다시 추천드릴까요?`
    }
    if (sub) {
      return `${sub} 상품은 현재 조건에 맞는 상품이 없어요. 조건을 완화해서 다시 검색해 보시겠어요?`
    }
    if (f.colors?.length) {
      const colorWord = cw || '요청하신 컬러'
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
    const n = products.length
    return `조건에 맞는 후보가 적어, 인기·평점 순으로 ${n}건을 넓혀서 골랐어요. 말씀하신 서브카테고리·색과 다를 수 있으니 상품 설명을 함께 확인해 주세요 😊`
  }

  return generateOverallReplyIntro(products, f)
}

/**
 * 고급 RAG: Hybrid 검색 → Rerank → Validation → 템플릿 응답
 * @param {string} message
 * @param {{ cartProductIds?: string[] }} [opts]
 */
export async function runRagChat(message, opts = {}) {
  const f = parseRagKeywords(message)
  console.log('[rag parsed]', {
    strictSubCategory: f.strictSubCategory,
    categories: f.categories,
    subCategories: f.subCategories,
    colors: f.colors,
    colorLabel: f.colorLabel,
  })

  let candidates = await hybridSearch(f)
  if (candidates.length < 6) {
    const extra = await searchRelaxedBlob(f)
    const m = new Map()
    for (const r of [...candidates, ...extra]) {
      if (r?.id != null) m.set(r.id, r)
    }
    candidates = [...m.values()]
  }
  candidates = filterByHardConstraints(candidates, f)

  let ranked = rerank(candidates, f)
  let slice = ranked.slice(0, TOP_K)
  let { rows: valid } = await validateCandidates(slice, f)

  if (opts.cartProductIds?.length && valid.length < 3) {
    const extra = await searchByCartContext(opts.cartProductIds, f)
    const merged = rerank(filterByHardConstraints([...valid, ...extra], f), f)
    slice = merged.slice(0, TOP_K)
    valid = (await validateCandidates(slice, f)).rows
  }

  let usedFallback = false
  if (valid.length === 0) {
    if (f.colors?.length || f.strictSubCategory) {
      // 색상·서브카테고리 필수: 조건을 깨는 fallback 금지
    } else {
      const constrained = await searchConstrainedFallback(f)
      if (constrained.length > 0) {
        ranked = rerank(constrained, f)
        valid = (await validateCandidates(ranked.slice(0, TOP_K), f)).rows
        usedFallback = true
      } else if (!f.categories?.length && f.minPrice == null && f.maxPrice == null) {
        const pop = await searchPopularFallback()
        ranked = rerank(pop, f)
        valid = (await validateCandidates(ranked.slice(0, TOP_K), f, { strictCategory: false })).rows
        usedFallback = true
      }
    }
  }

  const finalRanked = rerank(valid, f)
  const products = finalRanked.slice(0, FINAL_N).map(rowToApiProduct)
  console.log('[rag filtered]', {
    count: products.length,
    items: products.map((p) => ({
      id: p.id,
      category: p.category,
      subCategory: p.subCategory,
      colors: (p.colors || []).map((c) => c.name),
    })),
  })
  const text = generateAdvancedReply(products, f, { usedFallback })
  return { text, products }
}
