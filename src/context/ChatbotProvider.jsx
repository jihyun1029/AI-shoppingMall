import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChatbotContext } from './chatbotContext'
import { useCart } from '../hooks/useCart'
import { useProductCatalog } from '../hooks/useProductCatalog'
import { getChatbotAssistantReply } from '../services/chatbotService.js'
import { ChatbotButton } from '../components/chatbot/ChatbotButton.jsx'
import { ChatbotPanel } from '../components/chatbot/ChatbotPanel.jsx'
import { CHATBOT_WELCOME_MESSAGE } from '../data/chatbotMock'

const STORAGE_KEY = 'studio-line-chatbot-v1'

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function welcomeMessage() {
  return {
    id: 'welcome',
    role: 'assistant',
    content: CHATBOT_WELCOME_MESSAGE,
    productIds: [],
    createdAt: Date.now(),
  }
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
        })),
      ),
    )
  } catch {
    /* ignore */
  }
}

export function ChatbotProvider({ children }) {
  const { products } = useProductCatalog()
  const { items } = useCart()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(() => loadStored() ?? [welcomeMessage()])
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState('')

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
      try {
        const { reply, picks, intent, keywords } = await getChatbotAssistantReply({
          message: trimmed,
          products,
          cartProducts,
        })
        const ids = picks.map((p) => String(p.id))
        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: 'assistant',
            content: reply,
            productIds: ids,
            createdAt: Date.now(),
            ...(intent ? { intent } : {}),
            ...(keywords ? { keywords } : {}),
          },
        ])
      } catch {
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
    const next = [welcomeMessage()]
    setMessages(next)
    saveStored(next)
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
      toast,
      showToast,
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
      toast,
      showToast,
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
