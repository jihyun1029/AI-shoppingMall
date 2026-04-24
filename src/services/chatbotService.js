import { parseChatQuery } from '../utils/chatbotParser.js'
import { recommendProducts } from '../utils/chatbotRecommend.js'
import { attachLocalReasons } from '../utils/chatbotPickReasons.js'
import { apiFetch } from '../api/client.js'

/**
 * RAG: 서버 SQLite 검색 + 템플릿 응답 우선, 실패 시 로컬 룰베이스 폴백.
 * 외부 LLM 연동 시 VITE_CHATBOT_API_URL 유지 가능.
 *
 * @param {object} input
 * @param {string} input.message
 * @param {object[]} input.products
 * @param {object[]} [input.cartProducts]
 * @returns {Promise<{ reply: string, picks: object[], intent?: string, keywords?: object }>}
 * picks 항목은 서버 응답 시 `reason`(추천 이유) 문자열이 포함될 수 있음.
 */
export async function getChatbotAssistantReply({ message, products, cartProducts }) {
  const externalUrl = import.meta.env.VITE_CHATBOT_API_URL

  /** 로컬 SQLite 챗봇을 우선 — 상품별 reason 포함 */
  try {
    const data = await apiFetch('/api/chatbot', {
      method: 'POST',
      body: JSON.stringify({
        message,
        cartProductIds: (cartProducts || []).map((p) => p.id).filter(Boolean),
      }),
    })
    if (data && typeof data.text === 'string' && Array.isArray(data.products)) {
      const picks = attachLocalReasons(data.products.slice(0, 6), message)
      return {
        reply: data.text,
        picks,
        intent: typeof data.intent === 'string' ? data.intent : undefined,
        keywords: data.keywords && typeof data.keywords === 'object' ? data.keywords : undefined,
      }
    }
  } catch {
    /* 로컬 서버 없음 → 외부 또는 룰베이스 */
  }

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
          return {
            reply: String(data.reply),
            picks: attachLocalReasons(picks, message),
          }
        }
      }
    } catch {
      /* fall through */
    }
  }

  await new Promise((r) => setTimeout(r, 200))

  const q = parseChatQuery(message)
  const out = recommendProducts(products || [], q, { cartProducts: cartProducts || [] })
  return { ...out, picks: attachLocalReasons(out.picks, message) }
}
