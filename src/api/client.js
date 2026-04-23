import { loadSession } from '../utils/authStorage'

const base = () => import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  /** @param {number} status */
  constructor(status, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * @param {string} path
 * @param {RequestInit} [options]
 */
export async function apiFetch(path, options = {}) {
  const url = `${base()}${path}`
  const headers = new Headers(options.headers || {})
  if (options.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const session = loadSession()
  if (session?.token) {
    headers.set('Authorization', `Bearer ${session.token}`)
  }

  let res
  try {
    res = await fetch(url, { ...options, headers })
  } catch {
    throw new ApiError(
      0,
      'API 서버에 연결할 수 없습니다. 터미널에서 `npm run dev:server`(또는 `cd server && npm start`)로 백엔드를 먼저 실행한 뒤 새로고침해 주세요.',
    )
  }

  if (res.status === 204) return null

  const text = await res.text()
  let body = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = { message: text }
    }
  }

  const contentType = res.headers.get('content-type') || ''
  if (
    res.ok &&
    text &&
    !contentType.includes('application/json') &&
    !contentType.includes('application/problem+json')
  ) {
    throw new ApiError(
      502,
      'API 대신 HTML이 반환되었습니다. `npm run dev` 또는 `npm run preview`와 함께 백엔드(포트 4000)가 켜져 있는지, Vite 프록시가 적용된 주소로 접속했는지 확인해 주세요.',
    )
  }

  if (!res.ok) {
    const msg =
      (body && typeof body.message === 'string' && body.message) || res.statusText || '요청 실패'
    throw new ApiError(res.status, msg)
  }
  return body
}
