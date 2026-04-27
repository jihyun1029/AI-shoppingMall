import { classifyIntent, INTENT } from './intentClassifier.js'
import { buildAgentKeywords, parseRagKeywords } from './keywordParser.js'
import { assignRecommendReasons } from './recommendReasonService.js'
import { runProductRecommend } from './productService.js'
import { runCoordinationRecommend, runWeatherCoordinationRecommend } from './coordinationService.js'
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
export async function postChatbot(req, res) {
  const message = String(req.body?.message || '').trim()
  if (!message) {
    res.status(400).json({ message: 'message 필드가 필요합니다.' })
    return
  }

  const cartProductIds = Array.isArray(req.body?.cartProductIds)
    ? req.body.cartProductIds.map(String)
    : undefined

  const { intent } = classifyIntent(message)
  const parsedKeywords = parseRagKeywords(message)
  const keywords = buildAgentKeywords(message, parsedKeywords)

  try {
    let text = ''
    let productsRaw = []

    switch (intent) {
      case INTENT.CART_RECOMMEND: {
        const out = await runCartRecommend(message, cartProductIds || [])
        text = out.text
        productsRaw = out.products
        break
      }
      case INTENT.COORDINATION_RECOMMEND: {
        const out = await runCoordinationRecommend(message)
        text = out.text
        productsRaw = out.products
        break
      }
      case INTENT.WEATHER_COORDINATION: {
        const out = await runWeatherCoordinationRecommend(message)
        text = out.text
        productsRaw = out.products
        break
      }
      case INTENT.GENERAL_INFO: {
        const { text: t } = answerGeneralInfo(message)
        text = t
        productsRaw = []
        break
      }
      case INTENT.PRODUCT_RECOMMEND:
      default: {
        const out = await runProductRecommend(message, { cartProductIds })
        text = out.text
        productsRaw = out.products
        break
      }
    }

    const productsWithReason = productsRaw.length
      ? assignRecommendReasons(productsRaw, parsedKeywords, message)
      : []

    console.log('parsedKeywords:', parsedKeywords)
    console.log(
      'productsWithReason:',
      productsWithReason.map((p) => ({ id: p.id, name: p.name, reason: p.reason })),
    )

    res.json({
      intent,
      keywords,
      text,
      products: productsWithReason,
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: '챗봇 응답 생성 중 오류가 발생했습니다.' })
  }
}
