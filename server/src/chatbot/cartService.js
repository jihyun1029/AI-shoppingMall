import { parseRagKeywords } from './keywordParser.js'
import { searchByCartContext } from './searchService.js'
import { filterByHardConstraints, rerank } from './rankingService.js'
import { validateCandidates } from './validationService.js'
import { rowToApiProduct } from '../productRowMapper.js'

const TOP_K = 12
const FINAL_N = 5

/**
 * Intent: CART_RECOMMEND — 장바구니 카테고리 기반 연관 상품.
 * @param {string} message
 * @param {string[]} cartProductIds
 */
export async function runCartRecommend(message, cartProductIds) {
  const ids = (cartProductIds || []).map(String).filter(Boolean)
  if (!ids.length) {
    return {
      text: '장바구니에 담긴 상품이 없으면 맞춤 추천이 어려워요. 마음에 드는 상품을 담은 뒤 다시 물어봐 주세요.',
      products: [],
    }
  }

  const f = parseRagKeywords(message)
  const rows = await searchByCartContext(ids, f)
  const ranked = rerank(filterByHardConstraints(rows, f), f)
  const { rows: valid } = await validateCandidates(ranked.slice(0, TOP_K), f)
  const products = valid.slice(0, FINAL_N).map(rowToApiProduct)

  const text =
    products.length > 0
      ? '담아두신 상품과 같은 무드의 카테고리에서 골라, 함께 입기 좋은 아이템을 추천드릴게요. 하의·신발·가방 위주로 맞춰봤어요 😊'
      : '장바구니와 어울리면서도 조건에 맞는 상품을 찾지 못했어요. 검색 조건을 조금 바꿔 볼까요?'

  return { text, products }
}
