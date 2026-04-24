import { Link } from 'react-router-dom'
import { formatPrice } from '../../utils/format'
import { useCart } from '../../hooks/useCart'
import { ProductImage } from '../ProductImage'

/** @param {{ product: object, onAdded?: () => void }} props */
export function RecommendedProductCard({ product, onAdded }) {
  const { addItem } = useCart()
  const img = product.images?.[0] || product.image || ''
  const firstColor = product.colors?.[0]
  const firstSize = product.sizes?.[0]
  const discountRate = Number(product.discountRate) || 0

  const handleCart = () => {
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
    <article className="w-[190px] shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <Link to={`/products/${product.id}`} className="block aspect-square w-full overflow-hidden rounded-t-xl bg-zinc-100">
        <ProductImage
          product={product}
          src={img || undefined}
          alt={product.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </Link>
      <div className="space-y-1.5 p-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{product.brand}</p>
        <Link to={`/products/${product.id}`} className="line-clamp-2 min-h-[2.25rem] text-[11px] font-medium leading-snug text-zinc-900 hover:underline">
          {product.name}
        </Link>
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-semibold tabular-nums text-zinc-900">{formatPrice(product.price)}원</p>
          {discountRate > 0 ? (
            <span className="text-[10px] font-semibold text-red-500">{discountRate}%</span>
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <Link
            to={`/products/${product.id}`}
            className="rounded-lg border border-zinc-200 py-1.5 text-center text-[10px] font-medium text-zinc-700 hover:bg-zinc-50"
          >
            상세보기
          </Link>
          <button
            type="button"
            onClick={handleCart}
            disabled={!firstColor || !firstSize}
            className="rounded-lg bg-zinc-900 py-1.5 text-[10px] font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-45"
          >
            장바구니
          </button>
        </div>
      </div>
    </article>
  )
}
