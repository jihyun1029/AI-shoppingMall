import { parseChatQuery } from '../utils/chatbotParser.js'
import { recommendProducts } from '../utils/chatbotRecommend.js'

/**
 * OpenAI 등 외부 API 붙일 때 이 함수만 교체·확장하면 됩니다.
 * 지금은 룰베이스 추천만 사용합니다.
 *
 * @param {object} input
 * @param {string} input.message
 * @param {object[]} input.products
 * @param {object[]} [input.cartProducts]
 * @returns {Promise<{ reply: string, picks: object[] }>}
 */
export async function getChatbotAssistantReply({ message, products, cartProducts }) {
  const apiUrl = import.meta.env.VITE_CHATBOT_API_URL
  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl.replace(/\/$/, '')}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, productCount: products?.length ?? 0 }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data?.reply && Array.isArray(data?.productIds)) {
          const idSet = new Set(data.productIds.map(String))
          const picks = (products || []).filter((p) => idSet.has(String(p.id))).slice(0, 6)
          return { reply: String(data.reply), picks }
        }
      }
    } catch {
      /* fall through to local */
    }
  }

  await new Promise((r) => setTimeout(r, 380))

  const q = parseChatQuery(message)
  return recommendProducts(products || [], q, { cartProducts: cartProducts || [] })
}
