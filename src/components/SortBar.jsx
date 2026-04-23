import { useSearchParams } from 'react-router-dom'

const OPTIONS = [
  { id: 'popular', label: '인기순' },
  { id: 'newest', label: '최신순' },
  { id: 'price_asc', label: '낮은 가격순' },
  { id: 'price_desc', label: '높은 가격순' },
]

export function SortBar({ count }) {
  const [sp, setSp] = useSearchParams()
  const sort = sp.get('sort') || 'popular'

  const onChange = (id) => {
    setSp((prev) => {
      const n = new URLSearchParams(prev)
      if (id === 'popular') n.delete('sort')
      else n.set('sort', id)
      return n
    })
  }

  return (
    <div className="flex flex-col gap-3 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-zinc-500">
        <span className="font-medium text-zinc-900">{count}</span>개의 상품
      </p>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={[
              'rounded-full px-3 py-1.5 text-xs font-medium transition',
              sort === o.id || (o.id === 'popular' && !sp.get('sort'))
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200',
            ].join(' ')}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
