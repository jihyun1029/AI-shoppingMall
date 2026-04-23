import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { cartLineKey } from '../utils/cartLineKey'
import { CartContext } from './cartContext'
import { useAuth } from '../hooks/useAuth'
import { useProductCatalog } from '../hooks/useProductCatalog'

const STORAGE_KEY = 'studio-line-cart-v3'

function readStoredLines() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (l) =>
        l &&
        typeof l.key === 'string' &&
        typeof l.productId === 'string' &&
        typeof l.colorId === 'string' &&
        typeof l.colorLabel === 'string' &&
        typeof l.size === 'string' &&
        typeof l.quantity === 'number' &&
        l.quantity > 0,
    )
  } catch {
    return []
  }
}

function writeStoredLines(lines) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
  } catch {
    /* ignore */
  }
}

export function CartProvider({ children }) {
  const { products } = useProductCatalog()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [lines, setLines] = useState(() => readStoredLines())

  useEffect(() => {
    writeStoredLines(lines)
  }, [lines])

  const addItem = useCallback(({ productId, colorId, colorLabel, size, quantity = 1 }) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return false
    }
    const product = products.find((p) => String(p.id) === String(productId))
    if (!product || quantity < 1) return false
    const key = cartLineKey(productId, colorId, size)
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.key === key)
      if (idx === -1) {
        return [...prev, { key, productId, colorId, colorLabel, size, quantity }]
      }
      const next = [...prev]
      next[idx] = {
        ...next[idx],
        quantity: next[idx].quantity + quantity,
      }
      return next
    })
    return true
  }, [products, isAuthenticated, navigate, location])

  const setQuantity = useCallback((key, quantity) => {
    if (quantity < 1) {
      setLines((prev) => prev.filter((l) => l.key !== key))
      return
    }
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.key === key)
      if (idx === -1) return prev
      const next = [...prev]
      next[idx] = { ...next[idx], quantity }
      return next
    })
  }, [])

  const removeItem = useCallback((key) => {
    setLines((prev) => prev.filter((l) => l.key !== key))
  }, [])

  const clearCart = useCallback(() => setLines([]), [])

  const value = useMemo(() => {
    const items = lines
      .map((line) => {
        const product = products.find((p) => String(p.id) === String(line.productId))
        if (!product) return null
        return { ...line, product }
      })
      .filter(Boolean)

    const totalCount = items.reduce((sum, i) => sum + i.quantity, 0)
    const totalPrice = items.reduce(
      (sum, i) => sum + i.product.price * i.quantity,
      0,
    )

    return {
      lines,
      items,
      totalCount,
      totalPrice,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
    }
  }, [lines, products, addItem, setQuantity, removeItem, clearCart])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
