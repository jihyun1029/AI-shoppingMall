import { ProductCard } from './ProductCard'

/** @param {{ products: import('../data/products').Product[] }} props */
export function ProductGrid({ products }) {
  if (products.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-200 bg-white py-20 text-center text-sm text-zinc-500">
        조건에 맞는 상품이 없습니다.
      </p>
    )
  }

  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  )
}
