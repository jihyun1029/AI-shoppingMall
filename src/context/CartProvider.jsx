import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { cartLineKey } from '../utils/cartLineKey'
import { CartContext } from './cartContext'
import { useAuth } from '../hooks/useAuth'
import { useProductCatalog } from '../hooks/useProductCatalog'

const KEY_PREFIX = 'studio-line-cart-v3'

function storageKey(userId) {
  return userId ? `${KEY_PREFIX}-${userId}` : null
}

function readStoredLines(key) {
  try {
    const raw = localStorage.getItem(key)
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

function writeStoredLines(key, lines) {
  try {
    localStorage.setItem(key, JSON.stringify(lines))
  } catch {
    /* ignore */
  }
}

export function CartProvider({ children }) {
  const { products } = useProductCatalog()
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const key = storageKey(user?.id)
  const keyRef = useRef(key)
  keyRef.current = key

  const [lines, setLines] = useState(() => (key ? readStoredLines(key) : []))

  // 사용자 변경(로그인·로그아웃·계정 전환) 시 해당 사용자의 장바구니 로드
  useEffect(() => {
    setLines(key ? readStoredLines(key) : [])
  }, [key])

  // lines 변경 시 현재 사용자 키로 저장 (keyRef를 써서 이전 사용자 키에 쓰지 않음)
  useEffect(() => {
    if (!keyRef.current) return
    writeStoredLines(keyRef.current, lines)
  }, [lines])

  const addItem = useCallback(({ productId, colorId, colorLabel, size, quantity = 1 }) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return false
    }
    const product = products.find((p) => String(p.id) === String(productId))
    if (!product || quantity < 1) return false
    const k = cartLineKey(productId, colorId, size)
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.key === k)
      if (idx === -1) {
        return [...prev, { key: k, productId, colorId, colorLabel, size, quantity }]
      }
      const next = [...prev]
      next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity }
      return next
    })
    return true
  }, [products, isAuthenticated, navigate, location])

  const setQuantity = useCallback((k, quantity) => {
    if (quantity < 1) {
      setLines((prev) => prev.filter((l) => l.key !== k))
      return
    }
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.key === k)
      if (idx === -1) return prev
      const next = [...prev]
      next[idx] = { ...next[idx], quantity }
      return next
    })
  }, [])

  const removeItem = useCallback((k) => {
    setLines((prev) => prev.filter((l) => l.key !== k))
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
