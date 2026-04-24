import { runRagChat } from './ragService.js'

/**
 * POST /api/chatbot
 * body: { message: string, cartProductIds?: string[] }
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

  try {
    const { text, products } = runRagChat(db, message, { cartProductIds })
    res.json({ text, products })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: '챗봇 응답 생성 중 오류가 발생했습니다.' })
  }
}
