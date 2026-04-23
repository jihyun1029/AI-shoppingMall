import { CHATBOT_SUBTITLE } from '../../data/chatbotMock'

/** @param {{ onClose: () => void, onClear: () => void }} props */
export function ChatbotHeader({ onClose, onClear }) {
  return (
    <header className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3.5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">AI STYLE ASSISTANT</p>
        <h2 className="mt-1 text-sm font-semibold text-zinc-900">AI 스타일 추천</h2>
        <p className="mt-0.5 text-xs text-zinc-500">{CHATBOT_SUBTITLE}</p>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onClear}
          className="rounded-full px-2.5 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
          aria-label="대화 초기화"
        >
          초기화
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          aria-label="챗봇 닫기"
        >
          ×
        </button>
      </div>
    </header>
  )
}
