import { Link } from 'react-router-dom'
import { useRecentProducts } from '../../hooks/useRecentProducts'
import { RecentProductCard } from './RecentProductCard.jsx'

export function RecentProductsSection() {
  const { items, clearAll, remove } = useRecentProducts()

  return (
    <section className="border-t border-zinc-100 pt-12">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl">최근 본 상품</h2>
          <p className="mt-1 text-sm text-zinc-500">브라우저에만 저장되며, 최대 10개까지 최신 순으로 보여 드려요.</p>
        </div>
        {items.length > 0 ? (
          <button
            type="button"
            onClick={clearAll}
            className="self-start text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline sm:self-auto"
          >
            전체 삭제
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-12 text-center">
          <p className="text-sm font-medium text-zinc-700">최근 본 상품이 없습니다</p>
          <p className="mt-2 text-xs text-zinc-500">상품 상세를 둘러보면 여기에 자동으로 쌓여요.</p>
          <Link
            to="/shop"
            className="mt-6 inline-flex rounded-full bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800"
          >
            쇼핑하러 가기
          </Link>
        </div>
      ) : (
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 pt-0.5 [scrollbar-width:thin]">
          {items.map((item) => (
            <RecentProductCard key={item.id} item={item} onRemove={remove} />
          ))}
        </div>
      )}
    </section>
  )
}
