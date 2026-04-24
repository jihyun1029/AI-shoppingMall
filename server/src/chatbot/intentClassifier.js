import { parseChatQuery } from '../../../src/utils/chatbotParser.js'

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** @typedef {'PRODUCT_RECOMMEND'|'COORDINATION_RECOMMEND'|'CART_RECOMMEND'|'GENERAL_INFO'} ChatIntent */

export const INTENT = {
  PRODUCT_RECOMMEND: 'PRODUCT_RECOMMEND',
  COORDINATION_RECOMMEND: 'COORDINATION_RECOMMEND',
  CART_RECOMMEND: 'CART_RECOMMEND',
  GENERAL_INFO: 'GENERAL_INFO',
}

/**
 * 키워드 기반 Intent 분류 (LLM 없음).
 * 우선순위: 장바구니 → 코디/룩 → 일반 FAQ → 상품 추천.
 * @param {string} message
 * @returns {{ intent: ChatIntent, scores: Record<string, number> }}
 */
export function classifyIntent(message) {
  const n = norm(message)
  const q = parseChatQuery(message)

  /** @type {Record<string, number>} */
  const scores = {
    [INTENT.CART_RECOMMEND]: 0,
    [INTENT.COORDINATION_RECOMMEND]: 0,
    [INTENT.GENERAL_INFO]: 0,
    [INTENT.PRODUCT_RECOMMEND]: 0,
  }

  if (q.cartAssist || /장바구니|담은\s*옷|카트에|내가\s*담|담아\s*둔/.test(n)) {
    scores[INTENT.CART_RECOMMEND] += 100
  }

  if (
    /코디|조합|스타일링|매치업|매칭|어울리는|룩\s*추천|룩\s*알려|룩\s*짜|어떻게\s*입/.test(n) ||
    /출근룩|데이트룩|오피스룩|데일리룩|캐주얼룩|페미닌룩/.test(n) ||
    (/(출근|데이트|오피스|미팅|데일리|페미닌|캐주얼)/.test(n) && /(추천|알려|뭐\s*입|입을|입고)/.test(n))
  ) {
    scores[INTENT.COORDINATION_RECOMMEND] += 85
  }

  if (
    /배송|택배|도착|언제\s*와|몇\s*일|영업일/.test(n) ||
    /환불|교환|반품|취소|a\/s|as|고객센터|문의/.test(n) ||
    /이\s*쇼핑몰|뭐\s*하는|사이트\s*소개|이게\s*뭐/.test(n)
  ) {
    scores[INTENT.GENERAL_INFO] += 90
  }

  if (/추천|보여줘|보여|찾아|검색|있나|있어\?|팔아|구매|리스트|골라/.test(n)) {
    scores[INTENT.PRODUCT_RECOMMEND] += 55
  }
  if (q.categories?.length || q.subCategories?.length || q.colorNames?.length || q.maxPrice != null) {
    scores[INTENT.PRODUCT_RECOMMEND] += 35
  }

  const tieBreak = [
    INTENT.CART_RECOMMEND,
    INTENT.COORDINATION_RECOMMEND,
    INTENT.GENERAL_INFO,
    INTENT.PRODUCT_RECOMMEND,
  ]

  const best = Math.max(...Object.values(scores))
  let intent = /** @type {ChatIntent} */ (INTENT.PRODUCT_RECOMMEND)

  if (best <= 0) {
    intent = INTENT.GENERAL_INFO
  } else {
    const ties = tieBreak.filter((k) => scores[k] === best)
    intent = /** @type {ChatIntent} */ (ties[0] || INTENT.PRODUCT_RECOMMEND)
  }

  return { intent, scores }
}
