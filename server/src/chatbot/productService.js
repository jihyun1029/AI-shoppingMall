import { runRagChat } from './ragService.js'

/**
 * Intent: PRODUCT_RECOMMEND — 카테고리·가격·색상 필터 기반 상품 추천.
 * @param {string} message
 * @param {{ cartProductIds?: string[] }} [opts]
 */
export async function runProductRecommend(message, opts = {}) {
  return runRagChat(message, opts)
}
