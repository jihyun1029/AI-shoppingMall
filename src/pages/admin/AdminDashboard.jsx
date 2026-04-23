import { Link } from 'react-router-dom'
import { useProductCatalog } from '../../hooks/useProductCatalog'

export function AdminDashboard() {
  const { stats } = useProductCatalog()

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          관리자 대시보드
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          상품 등록/수정/삭제를 통해 사용자 쇼핑 화면과 데이터를 동기화합니다.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="전체 상품" value={`${stats.total}개`} />
        <StatCard label="품절 상품" value={`${stats.soldOut}개`} />
        <StatCard label="신상품" value={`${stats.newCount}개`} />
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">빠른 작업</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/admin/products"
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            상품 목록 관리
          </Link>
          <Link
            to="/admin/products/new"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            새 상품 등록
          </Link>
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">{value}</p>
    </article>
  )
}
