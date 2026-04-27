import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { WishlistContext } from './wishlistContext'
import { useAuth } from '../hooks/useAuth'

const KEY_PREFIX = 'studio-line-wishlist'

function storageKey(userId) {
  return userId ? `${KEY_PREFIX}-${userId}` : null
}

function readIds(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

function writeIds(key, ids) {
  try {
    localStorage.setItem(key, JSON.stringify(ids))
  } catch {
    /* ignore */
  }
}

export function WishlistProvider({ children }) {
  const { user } = useAuth()

  const key = storageKey(user?.id)
  const keyRef = useRef(key)
  keyRef.current = key

  const [ids, setIds] = useState(() => (key ? readIds(key) : []))

  // 사용자 변경(로그인·로그아웃·계정 전환) 시 해당 사용자의 찜 목록 로드
  useEffect(() => {
    setIds(key ? readIds(key) : [])
  }, [key])

  // ids 변경 시 현재 사용자 키로 저장
  useEffect(() => {
    if (!keyRef.current) return
    writeIds(keyRef.current, ids)
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
