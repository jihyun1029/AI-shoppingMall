/**
 * @param {{
 *   colors: { id: string; name: string; hex: string }[]
 *   sizes: string[]
 *   colorId: string
 *   size: string
 *   onColor: (id: string) => void
 *   onSize: (size: string) => void
 * }} props
 */
export function OptionSelector({ colors, sizes, colorId, size, onColor, onSize }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Color</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {colors.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onColor(c.id)}
              className={[
                'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                colorId === c.id
                  ? 'border-zinc-900 bg-zinc-900 text-white'
                  : 'border-zinc-200 text-zinc-700 hover:border-zinc-400',
              ].join(' ')}
            >
              <span
                className="h-4 w-4 rounded-full border border-black/10"
                style={{ backgroundColor: c.hex }}
              />
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Size</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {sizes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSize(s)}
              className={[
                'min-w-[2.75rem] rounded-lg border px-3 py-2 text-sm font-medium transition',
                size === s
                  ? 'border-zinc-900 bg-zinc-900 text-white'
                  : 'border-zinc-200 text-zinc-800 hover:border-zinc-400',
              ].join(' ')}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
