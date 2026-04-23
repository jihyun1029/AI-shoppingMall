import { useContext } from 'react'
import { ProductCatalogContext } from '../context/productCatalogContext'

export function useProductCatalog() {
  const ctx = useContext(ProductCatalogContext)
  if (!ctx) {
    throw new Error('useProductCatalog must be used within ProductCatalogProvider')
  }
  return ctx
}
