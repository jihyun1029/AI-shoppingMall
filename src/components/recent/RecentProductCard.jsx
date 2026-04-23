import { Link } from 'react-router-dom'
import { formatPrice } from '../../utils/format'
import { ProductImage } from '../ProductImage'

/** @param {{ item: { id: string, name: string, brand: string, price: number, image: string }, onRemove?: (id: string) => void }} props */
export function RecentProductCard({ item, onRemove }) {
  return (
    <article className="group relative w-[140px] shrink-0 sm:w-[160px]">
      {onRemove ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRemove(item.id)
          }}
          className="absolute right-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-xs font-medium text-zinc-600 shadow-sm opacity-0 ring-1 ring-zinc-200/80 transition hover:bg-zinc-900 hover:text-white hover:ring-zinc-900 group-hover:opacity-100"
          aria-label={`${item.name} 최근 본 기록에서 삭제`}
        >
          ×
        </button>
      ) : null}
      <Link
        to={`/products/${item.id}`}
        className="block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:border-zinc-900 hover:shadow-md"
      >
        <div className="aspect-[3/4] bg-zinc-100">
          {item.image ? (
            <ProductImage
              product={{ id: item.id, image: item.image, images: [item.image] }}
              src={item.image}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-zinc-400">No image</div>
          )}
        </div>
        <div className="space-y-0.5 p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{item.brand}</p>
          <p className="line-clamp-2 min-h-[2.25rem] text-[11px] font-medium leading-snug text-zinc-900">{item.name}</p>
          <p className="text-xs font-semibold tabular-nums text-zinc-900">{formatPrice(item.price)}원</p>
        </div>
      </Link>
    </article>
  )
}
