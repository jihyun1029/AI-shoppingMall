import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice, getDiscountPercent } from '../utils/format'
import { useWishlist } from '../hooks/useWishlist'
import { productImageCandidates, useProductImageSrc } from '../utils/productImage'

/** @param {{ product: import('../data/products').Product; dense?: boolean }} props */
export function ProductCard({ product, dense = false }) {
  const [hover, setHover] = useState(false)
  const { toggle, has } = useWishlist()
  const pct = getDiscountPercent(product)
  const mainList = useMemo(
    () =>
      productImageCandidates({
        ...product,
        image: product.images[0],
        images: [product.images[0]],
      }),
    [product],
  )
  const altList = useMemo(
    () =>
      productImageCandidates({
        ...product,
        image: product.images[1] ?? product.images[0],
        images: [product.images[1] ?? product.images[0]],
      }),
    [product],
  )
  const activeList = hover ? altList : mainList
  const { src: showImg, onError } = useProductImageSrc(activeList)
  const wished = has(product.id)

  return (
    <article
      className="group relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100">
        <Link to={`/products/${product.id}`} className="block h-full w-full">
          <img
            src={showImg}
            alt=""
            className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.02]"
            loading="lazy"
            onError={onError}
          />
        </Link>
        {pct > 0 && (
          <span className="absolute left-3 top-3 rounded bg-zinc-900 px-2 py-0.5 text-[11px] font-semibold text-white">
            {pct}%
          </span>
        )}
        {product.isNew && (
          <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-900">
            New
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            toggle(product.id)
          }}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-sm backdrop-blur transition hover:bg-white"
          aria-label={wished ? '찜 해제' : '찜하기'}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill={wished ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
        </button>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/50 to-transparent p-3 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="pointer-events-none text-center text-[11px] font-medium text-white">
            마우스를 올리면 다른 컷이 보입니다
          </span>
        </div>
      </div>
      <div className={dense ? 'mt-2 space-y-0.5' : 'mt-3 space-y-1'}>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          {product.brand}
        </p>
        <Link to={`/products/${product.id}`}>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-zinc-900 hover:underline">
            {product.name}
          </h3>
        </Link>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-semibold tabular-nums text-zinc-900">
            {formatPrice(product.price)}원
          </span>
          {pct > 0 && product.originalPrice && (
            <span className="text-xs tabular-nums text-zinc-400 line-through">
              {formatPrice(product.originalPrice)}원
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
