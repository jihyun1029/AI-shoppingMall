import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { getFilteredProducts } from '../utils/shopFilters'
import { FilterSidebar } from '../components/FilterSidebar'
import { SortBar } from '../components/SortBar'
import { ProductGrid } from '../components/ProductGrid'
import { useWishlist } from '../hooks/useWishlist'
import { useProductCatalog } from '../hooks/useProductCatalog'

export function ShopPage() {
  const [searchParams] = useSearchParams()
  const { ids: wishIds } = useWishlist()
  const { products: catalogProducts, error: catalogError } = useProductCatalog()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const savedOnly = searchParams.get('saved') === '1'

  const products = useMemo(() => {
    const base = getFilteredProducts(catalogProducts, searchParams)
    if (!savedOnly) return base
    return base.filter((p) => wishIds.includes(p.id))
  }, [catalogProducts, searchParams, savedOnly, wishIds])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      {catalogError ? (
        <div
          className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="status"
        >
          상품 API에 연결할 수 없습니다. 터미널에서{' '}
          <code className="rounded bg-amber-100/80 px-1">npm run dev:server</code> 로 백엔드를 띄운 뒤
          새로고침해 주세요. ({catalogError})
        </div>
      ) : null}
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            {savedOnly ? '찜한 상품' : 'Shop'}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-500">
            {savedOnly
              ? '하트를 눌러 담은 상품만 모아봅니다.'
              : '브랜드 · 카테고리 · 사이즈로 좁혀가며 둘러보세요.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="inline-flex w-fit items-center justify-center rounded-full border border-zinc-900 px-4 py-2 text-sm font-medium text-zinc-900 lg:hidden"
        >
          필터
        </button>
      </div>

      <div className="flex gap-10 lg:gap-12">
        <div className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-28">
            <FilterSidebar />
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-6">
          <SortBar count={products.length} />
          {savedOnly && wishIds.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 py-16 text-center text-sm text-zinc-500">
              아직 찜한 상품이 없습니다.
              <Link to="/shop" className="mt-4 block font-medium text-zinc-900 underline">
                쇼핑하러 가기
              </Link>
            </div>
          ) : (
            <ProductGrid products={products} />
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="필터 닫기"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative ml-auto flex h-full w-[min(100%,320px)] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
              <span className="text-sm font-semibold">필터</span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <FilterSidebar onClose={() => setMobileFiltersOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
