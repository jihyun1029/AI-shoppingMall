import { parseChatQuery } from '../utils/chatbotParser.js'
import { recommendProducts } from '../utils/chatbotRecommend.js'
import { apiFetch } from '../api/client.js'

/**
 * RAG: 서버 SQLite 검색 + 템플릿 응답 우선, 실패 시 로컬 룰베이스 폴백.
 * 외부 LLM 연동 시 VITE_CHATBOT_API_URL 유지 가능.
 *
 * @param {object} input
 * @param {string} input.message
 * @param {object[]} input.products
 * @param {object[]} [input.cartProducts]
 * @returns {Promise<{ reply: string, picks: object[] }>}
 */
export async function getChatbotAssistantReply({ message, products, cartProducts }) {
  const externalUrl = import.meta.env.VITE_CHATBOT_API_URL
  if (externalUrl) {
    try {
      const res = await fetch(`${externalUrl.replace(/\/$/, '')}/chat`, {
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
      /* fall through */
    }
  }

  try {
    const data = await apiFetch('/api/chatbot', {
      method: 'POST',
      body: JSON.stringify({
        message,
        cartProductIds: (cartProducts || []).map((p) => p.id).filter(Boolean),
      }),
    })
    if (data && typeof data.text === 'string' && Array.isArray(data.products)) {
      return {
        reply: data.text,
        picks: data.products.slice(0, 6),
        intent: typeof data.intent === 'string' ? data.intent : undefined,
        keywords: data.keywords && typeof data.keywords === 'object' ? data.keywords : undefined,
      }
    }
  } catch {
    /* 로컬 폴백 */
  }

  await new Promise((r) => setTimeout(r, 200))

  const q = parseChatQuery(message)
  return recommendProducts(products || [], q, { cartProducts: cartProducts || [] })
}
