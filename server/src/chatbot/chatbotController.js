import { classifyIntent, INTENT } from './intentClassifier.js'
import { buildAgentKeywords } from './keywordParser.js'
import { runProductRecommend } from './productService.js'
import { runCoordinationRecommend } from './coordinationService.js'
import { runCartRecommend } from './cartService.js'
import { answerGeneralInfo } from './generalInfoService.js'

/**
 * Agent 워크플로: Intent 분류 → 조건 추출 → Intent별 실행 → JSON 반환.
 *
 * POST /api/chatbot
 * body: { message: string, cartProductIds?: string[] }
 *
 * 응답: { intent, keywords, text, products }
 */
export function postChatbot(db, req, res) {
  const message = String(req.body?.message || '').trim()
  if (!message) {
    res.status(400).json({ message: 'message 필드가 필요합니다.' })
    return
  }

  const cartProductIds = Array.isArray(req.body?.cartProductIds)
    ? req.body.cartProductIds.map(String)
    : undefined

  const { intent } = classifyIntent(message)
  const keywords = buildAgentKeywords(message)

  try {
    let text = ''
    let products = []

    switch (intent) {
      case INTENT.CART_RECOMMEND: {
        const out = runCartRecommend(db, message, cartProductIds || [])
        text = out.text
        products = out.products
        break
      }
      case INTENT.COORDINATION_RECOMMEND: {
        const out = runCoordinationRecommend(db, message)
        text = out.text
        products = out.products
        break
      }
      case INTENT.GENERAL_INFO: {
        const { text: t } = answerGeneralInfo(message)
        text = t
        products = []
        break
      }
      case INTENT.PRODUCT_RECOMMEND:
      default: {
        const out = runProductRecommend(db, message, { cartProductIds })
        text = out.text
        products = out.products
        break
      }
    }

    console.log('[chatbot]', {
      intent,
      parsedKeywords: keywords,
      filteredProducts: products.map((p) => ({
        id: p.id,
        category: p.category,
        subCategory: p.subCategory,
      })),
    })

    res.json({
      intent,
      keywords,
      text,
      products,
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: '챗봇 응답 생성 중 오류가 발생했습니다.' })
  }
}
