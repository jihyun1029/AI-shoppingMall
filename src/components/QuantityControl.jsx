export function QuantityControl({
  value,
  min = 1,
  max = 99,
  onChange,
  disabled = false,
  size = 'md',
}) {
  const btn =
    size === 'sm'
      ? 'h-8 w-8 text-base leading-none'
      : 'h-10 w-10 text-lg leading-none'

  const clamp = (n) => Math.min(max, Math.max(min, n))

  return (
    <div className="inline-flex items-stretch overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <button
        type="button"
        className={`${btn} flex items-center justify-center text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-40`}
        onClick={() => onChange(clamp(value - 1))}
        disabled={disabled || value <= min}
        aria-label="수량 감소"
      >
        −
      </button>
      <span
        className={`flex min-w-[2.5rem] items-center justify-center border-x border-zinc-200 px-2 text-sm font-medium tabular-nums text-zinc-900 ${size === 'sm' ? 'text-sm' : 'text-base'}`}
      >
        {value}
      </span>
      <button
        type="button"
        className={`${btn} flex items-center justify-center text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-40`}
        onClick={() => onChange(clamp(value + 1))}
        disabled={disabled || value >= max}
        aria-label="수량 증가"
      >
        +
      </button>
    </div>
  )
}
