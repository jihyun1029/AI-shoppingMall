import jwt from 'jsonwebtoken'

function jwtSecret() {
  const s = process.env.JWT_SECRET
  if (!s) {
    console.warn('[auth] JWT_SECRET missing; using dev-only default')
    return 'dev-only-change-me'
  }
  return s
}

export function signToken(payload) {
  return jwt.sign(payload, jwtSecret(), { expiresIn: '7d' })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, jwtSecret())
  } catch {
    return null
  }
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const m = header.match(/^Bearer\s+(.+)$/i)
  const token = m?.[1]
  if (!token) {
    res.status(401).json({ message: '로그인이 필요합니다.' })
    return
  }
  const decoded = verifyToken(token)
  if (!decoded?.sub) {
    res.status(401).json({ message: '세션이 만료되었거나 유효하지 않습니다.' })
    return
  }
  req.auth = {
    userId: decoded.sub,
    email: decoded.email,
    role: decoded.role,
    name: decoded.name,
    gender: decoded.gender,
  }
  next()
}

export function requireAdmin(req, res, next) {
  if (req.auth?.role !== 'admin') {
    res.status(403).json({ message: '관리자만 접근할 수 있습니다.' })
    return
  }
  next()
}
