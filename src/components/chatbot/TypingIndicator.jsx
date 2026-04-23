export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl rounded-bl-md border border-zinc-200 bg-zinc-50 px-3.5 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.25s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.12s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
          <span className="ml-1 text-xs text-zinc-500">추천 중입니다...</span>
        </div>
      </div>
    </div>
  )
}
