import { useMemo, useState } from 'react'
import { useCart } from '../../hooks/useCart'
import { useProductCatalog } from '../../hooks/useProductCatalog'
import { recommendProductsByCart } from '../../utils/recommendProductsByCart.js'
import { RecommendedProductCard } from './RecommendedProductCard.jsx'

export function CartRecommendationSection() {
  const { items } = useCart()
  const { products } = useProductCatalog()
  const [toast, setToast] = useState('')

  const recs = useMemo(() => recommendProductsByCart(items, products, { min: 4, max: 8 }), [items, products])

  if (items.length === 0 || recs.length === 0) return null

  return (
    <section className="mt-14 border-t border-zinc-100 pt-12" aria-labelledby="cart-rec-title">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="cart-rec-title" className="text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl">
            장바구니 기반 추천
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            담아두신 카테고리·스타일을 기준으로 함께 코디하기 좋은 상품을 골랐어요.
          </p>
        </div>
      </div>

      <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 pt-1 [scrollbar-width:thin]">
        {recs.map(({ product, reason }) => (
          <RecommendedProductCard
            key={product.id}
            product={product}
            reason={reason}
            onAdded={() => {
              setToast('첫 옵션으로 장바구니에 담았어요.')
              window.setTimeout(() => setToast(''), 2000)
            }}
          />
        ))}
      </div>

      {toast ? (
        <p className="mt-3 text-center text-xs font-medium text-emerald-700" role="status">
          {toast}
        </p>
      ) : null}
    </section>
  )
}
