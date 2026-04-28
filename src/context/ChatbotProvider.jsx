import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChatbotContext } from './chatbotContext'
import { useCart } from '../hooks/useCart'
import { useProductCatalog } from '../hooks/useProductCatalog'
import { getChatbotAssistantReply } from '../services/chatbotService.js'
import { ChatbotButton } from '../components/chatbot/ChatbotButton.jsx'
import { ChatbotPanel } from '../components/chatbot/ChatbotPanel.jsx'

const STORAGE_KEY = 'studio-line-chatbot-v1'

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function loadStored() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m) => ({
        id: String(m.id || newId()),
        role: m.role,
        content: m.content,
        productIds: Array.isArray(m.productIds) ? m.productIds.map(String) : [],
        createdAt: Number(m.createdAt) || Date.now(),
        ...(typeof m.intent === 'string' ? { intent: m.intent } : {}),
        ...(m.keywords && typeof m.keywords === 'object' ? { keywords: m.keywords } : {}),
        ...(Array.isArray(m.recommendedProducts) ? { recommendedProducts: m.recommendedProducts } : {}),
        ...(typeof m.userQuery === 'string' ? { userQuery: m.userQuery } : {}),
      }))
  } catch {
    return null
  }
}

function saveStored(messages) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          productIds: m.productIds || [],
          createdAt: m.createdAt,
          ...(m.intent ? { intent: m.intent } : {}),
          ...(m.keywords ? { keywords: m.keywords } : {}),
          ...(m.recommendedProducts ? { recommendedProducts: m.recommendedProducts } : {}),
          ...(typeof m.userQuery === 'string' ? { userQuery: m.userQuery } : {}),
        })),
      ),
    )
  } catch {
    /* ignore */
  }
}

function removeStoredConversation() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem('chatContext')
    sessionStorage.removeItem('chatMessages')
    localStorage.removeItem('chatContext')
    localStorage.removeItem('chatMessages')
  } catch {
    /* ignore */
  }
}

/**
 * 응답 keywords + intent → 다음 질문에 넘길 lastContext 추출.
 */
function extractLastContext(intent, keywords) {
  if (!keywords) return null
  return {
    intent: intent || null,
    temperature: keywords.temperature ?? null,
    weatherQuery: keywords.weatherQuery ?? null,
    style: keywords.styleKeyword ?? null,
    styleKeyword: keywords.styleKeyword ?? null,
    bodyType: keywords.bodyType ?? null,
    categories: keywords.categories || [],
    subCategory: keywords.strictSubCategory ?? keywords.subCategories?.[0] ?? null,
    strictSubCategory: keywords.strictSubCategory ?? null,
    allowedSubCategories: keywords.allowedSubCategories || [],
    colors: keywords.colorTokens || [],
    color: keywords.color ?? null,
    colorLabel: keywords.colorLabel ?? null,
    minPrice: keywords.price?.min ?? null,
    minPriceOp: keywords.price?.minOp ?? null,
    maxPrice: keywords.price?.max ?? null,
    maxPriceOp: keywords.price?.maxOp ?? null,
    price:
      keywords.price && (keywords.price.min != null || keywords.price.max != null)
        ? { ...keywords.price }
        : null,
    excludedSubCategories: keywords.excludedSubCategories || [],
  }
}

function lastAssistantKeywordsFromMessages(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i]
    if (m?.role === 'assistant' && m.keywords && typeof m.keywords === 'object') return m.keywords
  }
  return null
}

export function ChatbotProvider({ children }) {
  const { products } = useProductCatalog()
  const { items } = useCart()
  const initialMessages = loadStored() ?? []
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(() => initialMessages)
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState('')
  const [parsedKeywords, setParsedKeywords] = useState(null)
  const [mergedContext, setMergedContext] = useState(null)
  const [resetVersion, setResetVersion] = useState(0)
  // 이전 대화 컨텍스트 (다음 요청에 전달)
  const [lastContext, setLastContext] = useState(() => {
    const kw = lastAssistantKeywordsFromMessages(initialMessages)
    const lastAsst = [...initialMessages].reverse().find((m) => m?.role === 'assistant' && m.intent)
    return kw ? extractLastContext(lastAsst?.intent, kw) : null
  })
  const lastContextRef = useRef(lastContext)
  lastContextRef.current = lastContext
  const requestSeqRef = useRef(0)

  useEffect(() => {
    saveStored(messages)
  }, [messages])

  const productById = useMemo(() => {
    const m = new Map()
    for (const p of products) m.set(String(p.id), p)
    return m
  }, [products])

  const cartProducts = useMemo(() => items.map((i) => i.product).filter(Boolean), [items])

  const openPanel = useCallback(() => setOpen(true), [])
  const closePanel = useCallback(() => setOpen(false), [])
  const togglePanel = useCallback(() => setOpen((v) => !v), [])

  const showToast = useCallback((msg) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2200)
  }, [])

  const sendUserMessage = useCallback(
    async (text) => {
      const trimmed = String(text || '').trim()
      if (!trimmed || sending) return

      const userMsg = {
        id: newId(),
        role: 'user',
        content: trimmed,
        productIds: [],
        createdAt: Date.now(),
      }
      setMessages((prev) => [...prev, userMsg])
      setSending(true)
      requestSeqRef.current += 1
      const requestSeq = requestSeqRef.current
      try {
        const { reply, picks, intent, keywords } = await getChatbotAssistantReply({
          message: trimmed,
          products,
          cartProducts,
          lastContext: lastContextRef.current,
        })
        if (requestSeq !== requestSeqRef.current) return
        const ids = picks.map((p) => String(p.id))
        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: 'assistant',
            content: reply,
            productIds: ids,
            userQuery: trimmed,
            createdAt: Date.now(),
            ...(intent ? { intent } : {}),
            ...(keywords ? { keywords } : {}),
            ...(picks.length ? { recommendedProducts: picks } : {}),
          },
        ])
        // 다음 질문을 위한 컨텍스트 저장
        const ctx = extractLastContext(intent, keywords)
        setParsedKeywords(keywords ?? null)
        setMergedContext(ctx)
        setLastContext(ctx)
      } catch {
        if (requestSeq !== requestSeqRef.current) return
        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: 'assistant',
            content: '응답을 만드는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
            productIds: [],
            createdAt: Date.now(),
          },
        ])
      } finally {
        setSending(false)
      }
    },
    [products, cartProducts, sending],
  )

  const clearConversation = useCallback(() => {
    requestSeqRef.current += 1
    removeStoredConversation()
    setMessages([])
    setParsedKeywords(null)
    setMergedContext(null)
    setLastContext(null)
    setToast('')
    setSending(false)
    setResetVersion((v) => v + 1)
  }, [])

  const value = useMemo(
    () => ({
      open,
      openPanel,
      closePanel,
      togglePanel,
      messages,
      sending,
      sendUserMessage,
      clearConversation,
      productById,
      products,
      parsedKeywords,
      mergedContext,
      toast,
      showToast,
      resetVersion,
    }),
    [
      open,
      openPanel,
      closePanel,
      togglePanel,
      messages,
      sending,
      sendUserMessage,
      clearConversation,
      productById,
      products,
      parsedKeywords,
      mergedContext,
      toast,
      showToast,
      resetVersion,
    ],
  )

  return (
    <ChatbotContext.Provider value={value}>
      {children}
      <ChatbotButton />
      <ChatbotPanel />
    </ChatbotContext.Provider>
  )
}
