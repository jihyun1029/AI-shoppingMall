import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Banner } from '../components/Banner'
import { CategoryMenu } from '../components/CategoryMenu'
import { SectionHeader } from '../components/SectionHeader'
import { ProductCard } from '../components/ProductCard'
import { useProductCatalog } from '../hooks/useProductCatalog'
import { RecentProductsSection } from '../components/recent/RecentProductsSection.jsx'

export function HomePage() {
  const { products, error: catalogError } = useProductCatalog()
  const newIn = useMemo(
    () => [...products].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 4),
    [products],
  )
  const popular = useMemo(
    () => [...products].sort((a, b) => b.popularity - a.popularity).slice(0, 4),
    [products],
  )
  const brands = useMemo(() => {
    const m = new Map()
    for (const p of products) m.set(p.brandId, p.brand)
    return [...m.entries()]
  }, [products])
  return (
    <div className="pb-16">
      <Banner />

      <div className="mx-auto max-w-7xl space-y-16 px-4 pt-12 sm:px-6">
        {catalogError ? (
          <div
            className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="status"
          >
            상품을 불러오지 못했습니다. API 서버를 실행한 뒤 새로고침해 주세요. ({catalogError})
          </div>
        ) : null}
        <section>
          <SectionHeader
            title="카테고리"
            subtitle="지금 입기 좋은 실루엣을 카테고리별로 모았습니다."
            to="/shop"
          />
          <CategoryMenu />
        </section>

        <section>
          <SectionHeader
            title="New In"
            subtitle="최근 입고된 시즌 피스."
            to="/shop?sort=newest"
            linkLabel="신상 전체"
          />
          <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {newIn.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>

        <section>
          <SectionHeader
            title="인기 상품"
            subtitle="지금 많이 찾는 베스트 셀러."
            to="/shop?sort=popular"
            linkLabel="랭킹 더보기"
          />
          <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {popular.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-zinc-50 px-6 py-10 sm:px-10">
          <SectionHeader
            title="브랜드"
            subtitle="에디터가 고른 시그니처 라벨."
          />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map(([id, name]) => (
              <Link
                key={id}
                to={`/shop?brand=${id}`}
                className="group flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4 transition hover:border-zinc-900"
              >
                <span className="text-sm font-semibold tracking-wide">{name}</span>
                <span className="text-xs text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-zinc-900">
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>

        <RecentProductsSection />
      </div>
    </div>
  )
}
