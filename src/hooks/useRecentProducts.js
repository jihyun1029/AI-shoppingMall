import { useCallback, useSyncExternalStore } from 'react'
import {
  clearRecentProducts,
  getRecentProductsServerSnapshot,
  getRecentProductsSnapshot,
  removeRecentProduct,
  subscribeRecentProducts,
} from '../utils/recentProductsStorage.js'

export function useRecentProducts() {
  const items = useSyncExternalStore(
    subscribeRecentProducts,
    getRecentProductsSnapshot,
    getRecentProductsServerSnapshot,
  )

  const clearAll = useCallback(() => {
    clearRecentProducts()
  }, [])

  const remove = useCallback((id) => {
    removeRecentProduct(id)
  }, [])

  return {
    items,
    count: items.length,
    clearAll,
    remove,
  }
}

export { recordRecentProductView } from '../utils/recentProductsStorage.js'
