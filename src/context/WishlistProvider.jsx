import { useCallback, useEffect, useMemo, useState } from 'react'
import { WishlistContext } from './wishlistContext'

const STORAGE_KEY = 'studio-line-wishlist'

function readIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

function writeIds(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    /* ignore */
  }
}

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(() => readIds())

  useEffect(() => {
    writeIds(ids)
  }, [ids])

  const toggle = useCallback((productId) => {
    setIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    )
  }, [])

  const has = useCallback((productId) => ids.includes(productId), [ids])

  const value = useMemo(
    () => ({ ids, toggle, has, count: ids.length }),
    [ids, toggle, has],
  )

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  )
}
