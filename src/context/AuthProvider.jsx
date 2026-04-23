import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch, ApiError } from '../api/client'
import { clearSession, loadSession, saveSession } from '../utils/authStorage'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadSession()?.user ?? null)

  useEffect(() => {
    const session = loadSession()
    if (!session?.token) return
    let cancelled = false
    ;(async () => {
      try {
        const data = await apiFetch('/api/auth/me')
        if (!cancelled && data?.user) setUser(data.user)
      } catch {
        if (!cancelled) {
          clearSession()
          setUser(null)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const signup = useCallback(async (payload) => {
    try {
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: payload.name.trim(),
          email: payload.email.trim().toLowerCase(),
          password: payload.password,
          gender: payload.gender || 'unknown',
        }),
      })
      return { ok: true }
    } catch (e) {
      return {
        ok: false,
        message: e instanceof ApiError ? e.message : '회원가입에 실패했습니다.',
      }
    }
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      })
      if (!data?.token || !data?.user) {
        return { ok: false, message: '로그인 응답이 올바르지 않습니다.' }
      }
      saveSession({ token: data.token, user: data.user })
      setUser(data.user)
      return { ok: true, user: data.user }
    } catch (e) {
      return {
        ok: false,
        message: e instanceof ApiError ? e.message : '로그인에 실패했습니다.',
      }
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    clearSession()
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      signup,
      login,
      logout,
    }),
    [user, signup, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
