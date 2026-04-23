import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SHOP_CATEGORIES } from '../data/products'
import { useProductCatalog } from '../hooks/useProductCatalog'

function parseList(param) {
  if (!param) return []
  return param.split(',').map((s) => s.trim()).filter(Boolean)
}

function toggleListValue(list, id) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

function setListParam(sp, key, list) {
  const n = new URLSearchParams(sp)
  if (list.length) n.set(key, list.join(','))
  else n.delete(key)
  return n
}

export function FilterSidebar({ onClose }) {
  const [sp, setSp] = useSearchParams()
  const { filters } = useProductCatalog()
  const [min, setMin] = useState(sp.get('min') ?? '')
  const [max, setMax] = useState(sp.get('max') ?? '')

  useEffect(() => {
    queueMicrotask(() => {
      setMin(sp.get('min') ?? '')
      setMax(sp.get('max') ?? '')
    })
  }, [sp])

  const brands = parseList(sp.get('brand'))
  const colors = parseList(sp.get('color'))
  const sizes = parseList(sp.get('size'))
  const category = sp.get('category') || 'all'

  const toggle = (key, id) => {
    const cur = parseList(sp.get(key))
    const next = toggleListValue(cur, id)
    setSp(setListParam(sp, key, next))
  }

  const setCategory = (id) => {
    setSp((prev) => {
      const n = new URLSearchParams(prev)
      if (!id || id === 'all') n.delete('category')
      else n.set('category', id)
      return n
    })
  }

  const applyPrice = () => {
    setSp((prev) => {
      const n = new URLSearchParams(prev)
      const minV = min.trim()
      const maxV = max.trim()
      if (minV) n.set('min', minV)
      else n.delete('min')
      if (maxV) n.set('max', maxV)
      else n.delete('max')
      return n
    })
    onClose?.()
  }

  const reset = () => {
    setSp((prev) => {
      const n = new URLSearchParams(prev)
      ;['brand', 'color', 'size', 'min', 'max', 'category', 'saved'].forEach((k) =>
        n.delete(k),
      )
      return n
    })
    setMin('')
    setMax('')
    onClose?.()
  }

  return (
    <aside className="space-y-8 text-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Filter
        </h2>
        <button
          type="button"
          onClick={reset}
          className="text-xs text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline"
        >
          초기화
        </button>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-zinc-900">카테고리</p>
        <ul className="space-y-1">
          {SHOP_CATEGORIES.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setCategory(c.id === 'all' ? '' : c.id)}
                className={[
                  'w-full rounded-lg px-2 py-1.5 text-left transition',
                  (c.id === 'all' && category === 'all') || c.id === category
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100',
                ].join(' ')}
              >
                {c.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-zinc-900">브랜드</p>
        <ul className="max-h-44 space-y-1 overflow-y-auto pr-1">
          {filters.brandFilters.map((b) => (
            <li key={b.id}>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-zinc-50">
                <input
                  type="checkbox"
                  checked={brands.includes(b.id)}
                  onChange={() => toggle('brand', b.id)}
                  className="rounded border-zinc-300"
                />
                <span className="text-zinc-700">{b.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-zinc-900">색상</p>
        <div className="flex flex-wrap gap-2">
          {filters.colorFilters.map((c) => (
            <button
              key={c.id}
              type="button"
              title={c.label}
              onClick={() => toggle('color', c.id)}
              className={[
                'h-8 w-8 rounded-full border-2 transition',
                colors.includes(c.id) ? 'border-zinc-900 ring-2 ring-zinc-300' : 'border-zinc-200',
              ].join(' ')}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-zinc-900">사이즈</p>
        <div className="flex flex-wrap gap-1.5">
          {filters.sizeFilters.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggle('size', s)}
              className={[
                'min-w-[2.25rem] rounded-md border px-2 py-1 text-xs font-medium transition',
                sizes.includes(s)
                  ? 'border-zinc-900 bg-zinc-900 text-white'
                  : 'border-zinc-200 text-zinc-600 hover:border-zinc-400',
              ].join(' ')}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-zinc-900">가격대 (원)</p>
        <div className="flex gap-2">
          <input
            value={min}
            onChange={(e) => setMin(e.target.value)}
            inputMode="numeric"
            placeholder="최소"
            className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-xs outline-none focus:border-zinc-900"
          />
          <input
            value={max}
            onChange={(e) => setMax(e.target.value)}
            inputMode="numeric"
            placeholder="최대"
            className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-xs outline-none focus:border-zinc-900"
          />
        </div>
        <button
          type="button"
          onClick={applyPrice}
          className="mt-2 w-full rounded-lg border border-zinc-900 py-1.5 text-xs font-semibold text-zinc-900 transition hover:bg-zinc-900 hover:text-white"
        >
          가격 적용
        </button>
      </div>
    </aside>
  )
}
