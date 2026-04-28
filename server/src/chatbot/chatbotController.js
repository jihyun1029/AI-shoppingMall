import { runWorkflow } from '../services/chatbotWorkflow.js'

/**
 * Agent 워크플로 기반 챗봇 엔드포인트.
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

  try {
    const { intent, keywords, text, products } = await runWorkflow(message, {
      cartProductIds,
    })

    res.json({ intent, keywords, text, products })
  } catch (e) {
    console.error('[chatbot] workflow error:', e)
    res.status(500).json({ message: '챗봇 응답 생성 중 오류가 발생했습니다.' })
  }
}
