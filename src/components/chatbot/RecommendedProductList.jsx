import { RecommendedProductCard } from './RecommendedProductCard.jsx'

/** @param {{ products: object[], onAdded?: () => void }} props */
export function RecommendedProductList({ products, onAdded }) {
  if (!products?.length) return null
  return (
    <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 pt-0.5">
      {products.map((p) => (
        <RecommendedProductCard key={p.id} product={p} onAdded={onAdded} />
      ))}
    </div>
  )
}
