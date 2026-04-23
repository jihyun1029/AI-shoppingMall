import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { QuantityControl } from '../components/QuantityControl'
import { OptionSelector } from '../components/OptionSelector'
import { ProductCard } from '../components/ProductCard'
import { formatPrice, getDiscountPercent } from '../utils/format'
import { recordRecentProductView } from '../hooks/useRecentProducts'
import { useProductCatalog } from '../hooks/useProductCatalog'
import { ProductImage } from '../components/ProductImage'

const REVIEWS = [
  { user: 'm***n', rating: 5, body: '핏이 예쁘고 소재가 부드러워요. 사이즈는 정사이즈 추천합니다.' },
  { user: 'k***e', rating: 4, body: '배송은 이틀 정도 걸렸고 포장도 깔끔했어요.' },
]

export function ProductDetailPage() {
  const { id } = useParams()
  const { getById, getRelated, loading: catalogLoading } = useProductCatalog()
  const product = id ? getById(id) : undefined
  const navigate = useNavigate()
  const { addItem } = useCart()

  const [imgIdx, setImgIdx] = useState(0)
  const [colorId, setColorId] = useState('')
  const [size, setSize] = useState('')
  const [qty, setQty] = useState(1)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!product) return
    recordRecentProductView(product)
    queueMicrotask(() => {
      setColorId(product.colors[0]?.id ?? '')
      setSize(product.sizes[0] ?? '')
      setImgIdx(0)
      setQty(1)
    })
  }, [product])

  const related = useMemo(() => (product ? getRelated(product.id, 4) : []), [product, getRelated])

  const mainGallerySrc = product ? product.images[imgIdx] ?? product.images[0] : ''

  if (catalogLoading && !product) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 shadow-sm">
        상품 정보를 불러오는 중입니다…
      </div>
    )
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">상품을 찾을 수 없습니다</h1>
        <Link
          to="/shop"
          className="mt-6 inline-flex rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Shop으로 이동
        </Link>
      </div>
    )
  }

  const color = product.colors.find((c) => c.id === colorId) ?? product.colors[0]
  const pct = getDiscountPercent(product)

  const commitAdd = () => {
    if (!color || !size) {
      setToast('색상과 사이즈를 선택해 주세요.')
      window.setTimeout(() => setToast(''), 2000)
      return false
    }
    const ok = addItem({
      productId: product.id,
      colorId: color.id,
      colorLabel: color.name,
      size,
      quantity: qty,
    })
    if (ok) {
      setToast('장바구니에 담았습니다.')
      window.setTimeout(() => setToast(''), 2000)
    }
    return ok
  }

  const handleBuyNow = () => {
    if (commitAdd()) navigate('/checkout')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 text-xs font-medium uppercase tracking-wider text-zinc-500 hover:text-zinc-900"
      >
        ← Back
      </button>

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="space-y-4 lg:col-span-7">
          <div className="aspect-[3/4] overflow-hidden bg-zinc-100">
            <ProductImage
              product={product}
              src={mainGallerySrc}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {product.images.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setImgIdx(i)}
                className={[
                  'h-20 w-16 shrink-0 overflow-hidden rounded-md ring-2 ring-offset-2',
                  imgIdx === i ? 'ring-zinc-900' : 'ring-transparent',
                ].join(' ')}
              >
                <ProductImage product={product} src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          <Link
            to={`/shop?brand=${product.brandId}`}
            className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500 hover:text-zinc-900"
          >
            {product.brand}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold leading-snug tracking-tight text-zinc-900 sm:text-3xl">
            {product.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-2xl font-semibold tabular-nums text-zinc-900">
              {formatPrice(product.price)}원
            </span>
            {pct > 0 && product.originalPrice && (
              <>
                <span className="text-base tabular-nums text-zinc-400 line-through">
                  {formatPrice(product.originalPrice)}원
                </span>
                <span className="rounded bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">
                  {pct}% OFF
                </span>
              </>
            )}
          </div>

          <div className="mt-8 space-y-8 border-t border-zinc-100 pt-8">
            <OptionSelector
              colors={product.colors}
              sizes={product.sizes}
              colorId={color?.id ?? ''}
              size={size}
              onColor={setColorId}
              onSize={setSize}
            />
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Qty
              </span>
              <QuantityControl value={qty} onChange={setQty} />
            </div>
            {toast && (
              <p className="text-sm font-medium text-emerald-600" role="status">
                {toast}
              </p>
            )}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => commitAdd()}
                className="flex-1 rounded-full border border-zinc-900 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-900 hover:text-white"
              >
                장바구니 담기
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="flex-1 rounded-full bg-zinc-900 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                바로 구매
              </button>
            </div>
          </div>

          <div className="mt-10 space-y-6 text-sm leading-relaxed text-zinc-600">
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">Description</h2>
              <p className="mt-2">{product.description}</p>
            </section>
            <section className="grid gap-4 sm:grid-cols-2">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">소재</h2>
                <p className="mt-2">{product.material}</p>
              </div>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">세탁</h2>
                <p className="mt-2">{product.care}</p>
              </div>
              <div className="sm:col-span-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">배송</h2>
                <p className="mt-2">{product.shipping}</p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <section className="mt-16 border-t border-zinc-100 pt-12">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">Reviews</h2>
        <ul className="mt-4 divide-y divide-zinc-100">
          {REVIEWS.map((r, i) => (
            <li key={i} className="py-4">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="font-medium text-zinc-800">{r.user}</span>
                <span>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
              </div>
              <p className="mt-2 text-sm text-zinc-600">{r.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {related.length > 0 && (
        <section className="mt-16 border-t border-zinc-100 pt-12">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">Related</h2>
          <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {related.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
