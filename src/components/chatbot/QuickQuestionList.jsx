import { CHATBOT_QUICK_QUESTIONS } from '../../data/chatbotMock'

/** @param {{ onSelect: (query: string) => void, disabled?: boolean }} props */
export function QuickQuestionList({ onSelect, disabled }) {
  return (
    <section className="shrink-0 border-t border-zinc-100 bg-zinc-50/90 px-3 py-2.5">
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">빠른 질문</p>
      <div className="flex flex-wrap gap-1.5">
        {CHATBOT_QUICK_QUESTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(item.query)}
            className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-700 transition hover:border-zinc-900 hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            {item.label}
          </button>
        ))}
      </div>
    </section>
  )
}
