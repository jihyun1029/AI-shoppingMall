import { parseChatQuery } from './chatbotParser.js'

function productColorNames(p) {
  return (p.colors || []).map((c) => String(c?.name || c || '')).filter(Boolean)
}

/**
 * 서버 `generateReason` 없이도 카드에 표시할 최소 추천 문구 (폴백·외부 챗 API용).
 * @param {object} product
 * @param {import('./chatbotParser.js').ParsedChatQuery} q
 * @param {number} index
 */
function buildLocalReason(product, q, index = 0) {
  const parts = []
  const subs = q.subCategories || []
  const sub = String(product.subCategory || '')
  const names = productColorNames(product)

  for (const cn of q.colorNames || []) {
    if (names.some((n) => n.includes(cn) || cn.includes(n))) {
      parts.push(`${cn} 컬러 조건에 맞는 상품이에요`)
      break
    }
  }

  if (subs.length && sub && subs.includes(sub)) {
    parts.push(`${sub}를 찾고 계셔서 추천드려요`)
  }

  if (q.maxPrice != null && Number(product.price) <= q.maxPrice) {
    parts.push('예산 조건에도 잘 맞아요')
  }

  if (Number(product.rating) >= 4.5) {
    parts.push('평점이 높아 만족도가 좋은 편이에요')
  }

  const head =
    parts.length > 0 ? `${parts.slice(0, 2).join('. ')}.` : '요청하신 조건을 반영한 상품이에요.'
  const util = [
    '데일리룩·출근룩에 활용하기 좋아요.',
    '일상 코디에 매치하기 좋아요.',
    '기본 아이템과 함께 입기 좋아요.',
  ][index % 3]

  return `${head} ${util}`.replace(/\s+/g, ' ').trim()
}

/**
 * picks에 reason이 없을 때만 채움 (서버 응답은 그대로 유지).
 * @param {object[]|undefined} picks
 * @param {string} message
 */
function hasUsableReason(p) {
  const r = p?.reason
  if (typeof r !== 'string') return false
  return r.trim().length > 0
}

export function attachLocalReasons(picks, message) {
  if (!Array.isArray(picks) || picks.length === 0) return picks || []
  const q = parseChatQuery(String(message || ''))
  return picks.map((p, i) => {
    if (!p) return p
    if (hasUsableReason(p)) return p
    return { ...p, reason: buildLocalReason(p, q, i) }
  })
}

/**
 * 단일 상품 + 사용자 질문으로 reason 보강
 * @param {object} product
 * @param {string} message
 */
export function ensureProductReason(product, message) {
  if (!product) return product
  if (typeof product.reason === 'string' && product.reason.trim()) return product
  const q = parseChatQuery(message)
  return { ...product, reason: buildLocalReason(product, q, 0) }
}
