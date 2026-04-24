import { useEffect, useMemo, useRef, useState } from 'react'
import { useChatbot } from '../../hooks/useChatbot'
import { CHATBOT_WELCOME_MESSAGE } from '../../data/chatbotMock'
import { ChatbotHeader } from './ChatbotHeader.jsx'
import { ChatMessage } from './ChatMessage.jsx'
import { ChatInput } from './ChatInput.jsx'
import { QuickQuestionList } from './QuickQuestionList.jsx'
import { TypingIndicator } from './TypingIndicator.jsx'

export function ChatbotPanel() {
  const {
    open,
    closePanel,
    messages,
    sending,
    sendUserMessage,
    clearConversation,
    productById,
    products,
    toast,
    showToast,
  } = useChatbot()
  const scrollRef = useRef(null)
  const [draft, setDraft] = useState('')
  const hasMessages = messages.length > 0
  const previewProducts = useMemo(() => products.slice(0, 3), [products])

  const handleSend = (text) => {
    sendUserMessage(text)
  }

  const handleQuickSelect = (query) => {
    sendUserMessage(query)
    setDraft('')
  }

  useEffect(() => {
    if (!open) return
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [open, messages, sending])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') closePanel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, closePanel])

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  if (!open) return null

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[58] bg-black/25 sm:bg-black/20"
        aria-label="채팅 패널 닫기"
        onClick={closePanel}
      />
      <aside
        className="fixed inset-x-0 bottom-0 top-[12%] z-[59] flex flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-2xl sm:inset-auto sm:bottom-6 sm:right-6 sm:top-24 sm:h-[min(560px,calc(100dvh-7rem))] sm:w-full sm:max-w-md sm:rounded-2xl"
        role="dialog"
        aria-label="AI 스타일 도우미"
      >
        <ChatbotHeader onClose={closePanel} onClear={clearConversation} />

        <div ref={scrollRef} className="min-h-0 min-w-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto px-3 py-3 sm:px-4">
          {!hasMessages ? (
            <ChatMessage role="assistant" content={CHATBOT_WELCOME_MESSAGE} products={previewProducts} onAdded={() => showToast('장바구니에 담았어요.')} />
          ) : null}
          {messages.map((m) => {
            const resolved =
              m.role === 'assistant' && m.productIds?.length
                ? m.productIds.map((id) => productById.get(String(id))).filter(Boolean)
                : []
            return (
              <ChatMessage
                key={m.id}
                role={m.role}
                content={m.content}
                products={resolved}
                intent={m.intent}
                onAdded={() => showToast('첫 번째 옵션으로 장바구니에 담았어요.')}
              />
            )
          })}
          {sending ? <TypingIndicator /> : null}
        </div>

        <QuickQuestionList onSelect={handleQuickSelect} disabled={sending} />

        <ChatInput
          value={draft}
          onChange={setDraft}
          onSend={handleSend}
          disabled={sending}
          placeholder="예: 검정 후드에 어울리는 바지 추천해줘"
        />

        {toast ? (
          <div
            className="pointer-events-none absolute bottom-24 left-1/2 z-10 -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-lg sm:bottom-20"
            role="status"
          >
            {toast}
          </div>
        ) : null}
      </aside>
    </>
  )
}
