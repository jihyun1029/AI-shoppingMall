/** @param {{ value: string, onChange: (value: string) => void, onSend: (text: string) => void, disabled?: boolean, placeholder?: string }} props */
export function ChatInput({ value, onChange, onSend, disabled, placeholder }) {

  const submit = () => {
    const t = value.trim()
    if (!t || disabled) return
    onSend(t)
    onChange('')
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="flex gap-2 border-t border-zinc-100 bg-white p-3"
    >
      <label className="sr-only" htmlFor="chatbot-input">
        메시지 입력
      </label>
      <input
        id="chatbot-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder || '예: 10만 원 이하 아우터 추천해줘'}
        className="min-w-0 flex-1 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-900 disabled:opacity-50"
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="shrink-0 rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        전송
      </button>
    </form>
  )
}
