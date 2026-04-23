const USERS_KEY = 'studio-line-users'
const SESSION_KEY = 'studio-line-auth-session'

function parseOrFallback(raw, fallback) {
  try {
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

export function loadUsers() {
  const raw = localStorage.getItem(USERS_KEY)
  if (!raw) return []
  const list = parseOrFallback(raw, [])
  return Array.isArray(list) ? list : []
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function loadSession() {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  const session = parseOrFallback(raw, null)
  if (!session || typeof session !== 'object') return null
  if (!session.token || typeof session.token !== 'string') {
    clearSession()
    return null
  }
  return session
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}
