import { useChatbot } from '../../hooks/useChatbot'

export function ChatbotButton() {
  const { open, togglePanel } = useChatbot()

  return (
    <button
      type="button"
      onClick={togglePanel}
      className={[
        'fixed bottom-5 right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition sm:bottom-6 sm:right-6',
        open
          ? 'bg-zinc-800 text-white ring-2 ring-zinc-400'
          : 'bg-zinc-900 text-white hover:-translate-y-0.5 hover:bg-zinc-800',
      ].join(' ')}
      aria-label={open ? '스타일 도우미 닫기' : 'AI 스타일 도우미 열기'}
      title="AI 스타일 추천"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
        <path
          d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H10l-4 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-7Z"
          fill="currentColor"
        />
      </svg>
    </button>
  )
}
