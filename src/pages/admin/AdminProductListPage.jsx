import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SHOP_CATEGORIES, GENDER_OPTIONS } from '../../data/products'
import { useProductCatalog } from '../../hooks/useProductCatalog'
import { formatPrice } from '../../utils/format'
import { ApiError } from '../../api/client'
import { ProductImage } from '../../components/ProductImage'

export function AdminProductListPage() {
  const { products, deleteProduct, resetProducts } = useProductCatalog()
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('all')
  const [gender, setGender] = useState('all')
  const [sort, setSort] = useState('newest')

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase()
    let list = products
    if (keyword) {
      list = list.filter((p) =>
        `${p.brand} ${p.name}`.toLowerCase().includes(keyword),
      )
    }
    if (category !== 'all') list = list.filter((p) => p.category === category)
    if (gender !== 'all') list = list.filter((p) => p.gender === gender)

    const next = [...list]
    switch (sort) {
      case 'price':
        next.sort((a, b) => b.price - a.price)
        break
      case 'stock':
        next.sort((a, b) => b.stock - a.stock)
        break
      case 'newest':
      default:
        next.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        break
    }
    return next
  }, [products, q, category, gender, sort])

  const onDelete = async (id, name) => {
    if (!window.confirm(`"${name}" 상품을 삭제하시겠습니까?`)) return
    try {
      await deleteProduct(id)
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : '삭제에 실패했습니다.'
      window.alert(msg)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">상품 관리</h1>
          <p className="mt-1 text-sm text-zinc-500">
            상품 CRUD 결과가 사용자 쇼핑 화면에 즉시 반영됩니다. 경로:{' '}
            <span className="font-mono text-xs text-zinc-600">/admin/products</span>
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <p className="max-w-md text-right text-xs text-zinc-500 sm:max-w-xs">
            SQLite의 상품을 모두 지우고, 서버에 포함된 여성 시드(100건·이미지 경로 포함)를 다시
            넣습니다. 관리자 권한이 필요합니다.
          </p>
          <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={async () => {
              if (
                !window.confirm(
                  '상품 테이블을 비운 뒤, 여성 패션 시드 데이터 100건으로 다시 채울까요?\n(기존에 등록한 상품은 모두 삭제됩니다.)',
                )
              )
                return
              try {
                await resetProducts()
                window.alert('시드가 다시 적용되었습니다. 쇼핑몰에서 새로고침해 주세요.')
              } catch (e) {
                const msg = e instanceof ApiError ? e.message : '시드 재적용에 실패했습니다.'
                window.alert(msg)
              }
            }}
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            aria-label="SQLite 상품 시드 100건 다시 불러오기"
          >
            시드 재적용 (100건)
          </button>
          <Link
            to="/admin/products/new"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            상품 등록
          </Link>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="상품명/브랜드 검색"
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          >
            {SHOP_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                카테고리: {c.label}
              </option>
            ))}
          </select>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          >
            <option value="all">성별: 전체</option>
            {GENDER_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                성별: {g.label}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          >
            <option value="newest">정렬: 최신순</option>
            <option value="price">정렬: 가격순</option>
            <option value="stock">정렬: 재고순</option>
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">이미지</th>
                <th className="px-4 py-3 font-medium">브랜드/상품</th>
                <th className="px-4 py-3 font-medium">카테고리</th>
                <th className="px-4 py-3 font-medium">가격</th>
                <th className="px-4 py-3 font-medium">할인율</th>
                <th className="px-4 py-3 font-medium">재고</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-zinc-100 align-top">
                  <td className="px-4 py-3 text-zinc-500">{p.id}</td>
                  <td className="px-4 py-3">
                    <ProductImage
                      product={p}
                      src={p.image || p.images?.[0]}
                      alt=""
                      className="h-14 w-12 rounded object-cover ring-1 ring-zinc-200"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      {p.brand}
                    </p>
                    <p className="mt-1 font-medium text-zinc-900">{p.name}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {SHOP_CATEGORIES.find((c) => c.id === p.category)?.label ?? p.category}
                    <span className="block text-xs text-zinc-400">{p.subCategory}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {formatPrice(p.price)}원
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{p.discountRate || 0}%</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        Number(p.stock) <= 0
                          ? 'rounded bg-red-50 px-2 py-1 text-xs text-red-600'
                          : 'text-zinc-700'
                      }
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.isNew && (
                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                          NEW
                        </span>
                      )}
                      {p.isBest && (
                        <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                          BEST
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        to={`/admin/products/edit/${p.id}`}
                        className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
                      >
                        수정
                      </Link>
                      <button
                        type="button"
                        onClick={() => onDelete(p.id, p.name)}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
