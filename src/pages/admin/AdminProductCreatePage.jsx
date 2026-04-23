import { useNavigate } from 'react-router-dom'
import { ProductForm } from '../../components/admin/ProductForm'
import { useProductCatalog } from '../../hooks/useProductCatalog'
import { ApiError } from '../../api/client'

export function AdminProductCreatePage() {
  const navigate = useNavigate()
  const { createProduct } = useProductCatalog()

  const onSubmit = async (formData) => {
    try {
      const created = await createProduct(formData)
      navigate(`/admin/products/edit/${created.id}`, {
        replace: true,
        state: { justCreated: true },
      })
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : '상품 등록에 실패했습니다.'
      window.alert(msg)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">상품 등록</h1>
        <p className="mt-1 text-sm text-zinc-500">필수 정보를 입력하고 저장하세요.</p>
      </header>
      <ProductForm onSubmit={onSubmit} submitLabel="상품 등록" />
    </div>
  )
}
