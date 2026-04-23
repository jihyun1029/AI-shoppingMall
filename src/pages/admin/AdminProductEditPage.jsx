import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ProductForm } from '../../components/admin/ProductForm'
import { useProductCatalog } from '../../hooks/useProductCatalog'
import { ApiError } from '../../api/client'

export function AdminProductEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getById, updateProduct, loading } = useProductCatalog()
  const product = id ? getById(id) : null

  if (!loading && !product) {
    return <Navigate to="/admin/products" replace />
  }

  if (!product) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
        불러오는 중…
      </div>
    )
  }

  const onSubmit = async (formData) => {
    try {
      await updateProduct(product.id, formData)
      navigate('/admin/products')
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : '저장에 실패했습니다.'
      window.alert(msg)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">상품 수정</h1>
          <p className="mt-1 text-sm text-zinc-500">ID {product.id} 상품 정보를 수정합니다.</p>
        </div>
        <Link
          to="/admin/products"
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          목록으로
        </Link>
      </header>
      <ProductForm initial={product} onSubmit={onSubmit} submitLabel="수정 저장" />
    </div>
  )
}
