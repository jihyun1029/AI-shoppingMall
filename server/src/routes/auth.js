import express from 'express'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { requireAuth, signToken } from '../middleware/auth.js'

const RESERVED_REGISTER_EMAIL = 'admin@studio-line.com'

function rowToPublicUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    gender: row.gender,
    role: row.role,
  }
}

function issueAuthResponse(row) {
  const token = signToken({
    sub: row.id,
    email: row.email,
    role: row.role,
    name: row.name,
    gender: row.gender,
  })
  return { token, user: rowToPublicUser(row) }
}

export function createAuthRouter(db) {
  const r = express.Router()

  r.post('/register', (req, res) => {
    const name = String(req.body?.name || '').trim()
    const email = String(req.body?.email || '').trim().toLowerCase()
    const password = String(req.body?.password || '')
    const gender = String(req.body?.gender || 'unknown').trim() || 'unknown'

    if (!name || !email || password.length < 4) {
      res.status(400).json({ message: '이름, 이메일, 비밀번호(4자 이상)를 확인해 주세요.' })
      return
    }
    if (email === RESERVED_REGISTER_EMAIL) {
      res.status(400).json({ message: '사용할 수 없는 이메일입니다.' })
      return
    }

    const exists = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email)
    if (exists) {
      res.status(409).json({ message: '이미 가입된 이메일입니다.' })
      return
    }

    const id = randomUUID()
    const hash = bcrypt.hashSync(password, 10)
    const now = new Date().toISOString()
    try {
      db.prepare(
        `INSERT INTO users (id, email, password_hash, name, gender, role, created_at)
         VALUES (?, ?, ?, ?, ?, 'user', ?)`,
      ).run(id, email, hash, name, gender, now)
    } catch {
      res.status(409).json({ message: '이미 가입된 이메일입니다.' })
      return
    }

    res.status(201).json({ ok: true })
  })

  r.post('/login', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase()
    const password = String(req.body?.password || '')
    const row = db
      .prepare(`SELECT id, email, password_hash, name, gender, role FROM users WHERE email = ?`)
      .get(email)

    if (!row || !bcrypt.compareSync(password, row.password_hash)) {
      res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' })
      return
    }

    const { password_hash: _, ...safe } = row
    res.json(issueAuthResponse(safe))
  })

  r.get('/me', requireAuth, (req, res) => {
    const row = db
      .prepare(`SELECT id, email, name, gender, role FROM users WHERE id = ?`)
      .get(req.auth.userId)
    if (!row) {
      res.status(401).json({ message: '사용자를 찾을 수 없습니다.' })
      return
    }
    res.json({ user: rowToPublicUser(row) })
  })

  return r
}
