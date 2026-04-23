import { useCallback, useEffect, useMemo, useState } from 'react'
import { ProductCatalogContext } from './productCatalogContext'
import { apiFetch, ApiError } from '../api/client'

export function ProductCatalogProvider({ children }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    const data = await apiFetch('/api/products')
    setProducts(Array.isArray(data?.products) ? data.products : [])
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        await refresh()
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof ApiError ? e.message : '상품을 불러오지 못했습니다.'
          setError(msg)
          setProducts([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refresh])

  const getById = useCallback(
    (id) => products.find((p) => String(p.id) === String(id)),
    [products],
  )

  const getRelated = useCallback(
    (productId, limit = 4) => {
      const self = products.find((p) => String(p.id) === String(productId))
      if (!self) return []
      const sameBrand = products.filter(
        (p) => p.brandId === self.brandId && String(p.id) !== String(self.id),
      )
      const sameCat = products.filter(
        (p) =>
          p.category === self.category &&
          String(p.id) !== String(self.id) &&
          p.brandId !== self.brandId,
      )
      const merged = [
        ...sameBrand,
        ...sameCat,
        ...products.filter((p) => String(p.id) !== String(self.id)),
      ]
      const seen = new Set()
      const out = []
      for (const p of merged) {
        if (seen.has(p.id)) continue
        seen.add(p.id)
        out.push(p)
        if (out.length >= limit) break
      }
      return out
    },
    [products],
  )

  const createProduct = useCallback(async (input) => {
    const data = await apiFetch('/api/products', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    const product = data?.product
    if (!product) throw new ApiError(500, '상품 생성 응답이 올바르지 않습니다.')
    setProducts((prev) => {
      const rest = prev.filter((p) => String(p.id) !== String(product.id))
      return [product, ...rest]
    })
    return product
  }, [])

  const updateProduct = useCallback(async (id, input) => {
    const data = await apiFetch(`/api/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
    const product = data?.product
    if (!product) throw new ApiError(500, '상품 수정 응답이 올바르지 않습니다.')
    setProducts((prev) => prev.map((p) => (String(p.id) === String(id) ? product : p)))
    return product
  }, [])

  const deleteProduct = useCallback(async (id) => {
    await apiFetch(`/api/products/${encodeURIComponent(id)}`, { method: 'DELETE' })
    setProducts((prev) => prev.filter((p) => String(p.id) !== String(id)))
  }, [])

  const resetProducts = useCallback(async () => {
    const data = await apiFetch('/api/products/actions/reseed', { method: 'POST' })
    const next = Array.isArray(data?.products) ? data.products : []
    setProducts(next)
    return next
  }, [])

  const stats = useMemo(() => {
    const total = products.length
    const soldOut = products.filter((p) => Number(p.stock || 0) <= 0).length
    const newCount = products.filter((p) => p.isNew).length
    return { total, soldOut, newCount }
  }, [products])

  const filters = useMemo(() => {
    const brandFilters = [
      ...new Map(products.map((p) => [p.brandId, { id: p.brandId, label: p.brand }])).values(),
    ].sort((a, b) => a.label.localeCompare(b.label))

    const colorMap = new Map()
    for (const p of products) {
      for (const c of p.colors || []) {
        if (!colorMap.has(c.id)) colorMap.set(c.id, { id: c.id, label: c.name, hex: c.hex })
      }
    }
    const colorFilters = [...colorMap.values()].sort((a, b) => a.label.localeCompare(b.label))
    const sizeFilters = [...new Set(products.flatMap((p) => p.sizes || []))].sort()
    return { brandFilters, colorFilters, sizeFilters }
  }, [products])

  const value = useMemo(
    () => ({
      products,
      loading,
      error,
      stats,
      filters,
      getById,
      getRelated,
      createProduct,
      updateProduct,
      deleteProduct,
      resetProducts,
      refreshCatalog: refresh,
    }),
    [
      products,
      loading,
      error,
      stats,
      filters,
      getById,
      getRelated,
      createProduct,
      updateProduct,
      deleteProduct,
      resetProducts,
      refresh,
    ],
  )

  return (
    <ProductCatalogContext.Provider value={value}>
      {children}
    </ProductCatalogContext.Provider>
  )
}
