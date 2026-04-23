export function LoadingSpinner({ label = '불러오는 중…' }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-16 text-zinc-500"
      role="status"
      aria-live="polite"
    >
      <span
        className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-200 border-t-amber-500"
        aria-hidden
      />
      <span className="text-sm">{label}</span>
    </div>
  )
}
