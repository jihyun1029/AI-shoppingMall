import { Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { QuantityControl } from './QuantityControl'
import { formatPrice } from '../utils/format'
import { ProductImage } from './ProductImage'

export function CartItem({ line }) {
  const { product, quantity, colorLabel, size, key: lineKey } = line
  const { setQuantity, removeItem } = useCart()

  return (
    <li className="flex flex-col gap-4 border-b border-zinc-100 py-6 last:border-0 sm:flex-row sm:items-center">
      <Link to={`/products/${product.id}`} className="flex shrink-0 gap-4 sm:w-[300px]">
        <ProductImage
          product={product}
          src={product.images[0]}
          alt=""
          className="h-28 w-24 rounded-lg object-cover ring-1 ring-zinc-100"
        />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            {product.brand}
          </p>
          <h3 className="mt-0.5 font-medium text-zinc-900 line-clamp-2">{product.name}</h3>
          <p className="mt-1 text-xs text-zinc-500">
            {colorLabel} · {size}
          </p>
          <p className="mt-1 text-sm font-semibold tabular-nums">{formatPrice(product.price)}원</p>
        </div>
      </Link>
      <div className="flex flex-1 flex-wrap items-center justify-between gap-4 sm:justify-end">
        <QuantityControl value={quantity} onChange={(q) => setQuantity(lineKey, q)} />
        <div className="text-right">
          <p className="text-xs text-zinc-500">소계</p>
          <p className="text-base font-semibold tabular-nums text-zinc-900">
            {formatPrice(product.price * quantity)}원
          </p>
        </div>
        <button
          type="button"
          onClick={() => removeItem(lineKey)}
          className="text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline"
        >
          삭제
        </button>
      </div>
    </li>
  )
}
