import { Link } from 'react-router-dom'
import { formatPrice, getDiscountPercent } from '../../utils/format'
import { useCart } from '../../hooks/useCart'
import { ProductImage } from '../ProductImage'

/** @param {{ product: object, reason?: string, onAdded?: () => void }} props */
export function RecommendedProductCard({ product, reason, onAdded }) {
  const { addItem } = useCart()
  const img = product.images?.[0] || product.image || ''
  const pct = getDiscountPercent(product)
  const firstColor = product.colors?.[0]
  const firstSize = product.sizes?.[0]

  const handleAdd = () => {
    if (!firstColor || !firstSize) return
    const ok = addItem({
      productId: product.id,
      colorId: firstColor.id,
      colorLabel: firstColor.name,
      size: firstSize,
      quantity: 1,
    })
    if (ok) onAdded?.()
  }

  return (
    <article className="group flex w-[200px] shrink-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-900 hover:shadow-md sm:w-[220px]">
      <Link to={`/products/${product.id}`} className="block aspect-[3/4] bg-zinc-100">
        <ProductImage
          product={product}
          src={img || undefined}
          alt=""
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        {reason ? <p className="text-[11px] leading-snug text-zinc-500">{reason}</p> : null}
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{product.brand}</p>
        <Link to={`/products/${product.id}`} className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-zinc-900 hover:underline">
          {product.name}
        </Link>
        <div className="mt-auto flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-semibold tabular-nums text-zinc-900">{formatPrice(product.price)}원</span>
          {pct > 0 && product.originalPrice ? (
            <>
              <span className="text-xs tabular-nums text-zinc-400 line-through">{formatPrice(product.originalPrice)}원</span>
              <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600">{pct}%</span>
            </>
          ) : null}
        </div>
        <div className="flex gap-2 pt-1">
          <Link
            to={`/products/${product.id}`}
            className="flex-1 rounded-full border border-zinc-200 py-2 text-center text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            상세
          </Link>
          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 rounded-full bg-zinc-900 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
          >
            담기
          </button>
        </div>
      </div>
    </article>
  )
}
