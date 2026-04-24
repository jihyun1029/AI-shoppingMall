import { RecommendedProductCard } from './RecommendedProductCard.jsx'

/** @param {{ products: object[], onAdded?: () => void }} props */
export function RecommendedProductList({ products, onAdded }) {
  if (!products?.length) return null
  return (
    <div className="mt-3 max-w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/70 p-2">
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-zinc-500">추천 상품</p>
      <div className="flex flex-nowrap gap-4 overflow-x-auto pb-2">
        {products.map((p) => (
          <RecommendedProductCard key={p.id} product={p} onAdded={onAdded} />
        ))}
      </div>
    </div>
  )
}
