import express from 'express'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { requireAuth, signToken } from '../middleware/auth.js'
import { User } from '../models/User.js'

const RESERVED_REGISTER_EMAIL = 'admin@studio-line.com'

function rowToPublicUser(doc) {
  return {
    id: doc._id,
    email: doc.email,
    name: doc.name,
    gender: doc.gender,
    role: doc.role,
  }
}

function issueAuthResponse(doc) {
  const token = signToken({
    sub: doc._id,
    email: doc.email,
    role: doc.role,
    name: doc.name,
    gender: doc.gender,
  })
  return { token, user: rowToPublicUser(doc) }
}

export function createAuthRouter() {
  const r = express.Router()

  r.post('/register', async (req, res) => {
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

    const exists = await User.findOne({ email })
    if (exists) {
      res.status(409).json({ message: '이미 가입된 이메일입니다.' })
      return
    }

    const id = randomUUID()
    const hash = bcrypt.hashSync(password, 10)
    const now = new Date().toISOString()
    try {
      await User.create({ _id: id, email, password_hash: hash, name, gender, role: 'user', created_at: now })
    } catch {
      res.status(409).json({ message: '이미 가입된 이메일입니다.' })
      return
    }

    res.status(201).json({ ok: true })
  })

  r.post('/login', async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase()
    const password = String(req.body?.password || '')
    const doc = await User.findOne({ email }).lean()

    if (!doc || !bcrypt.compareSync(password, doc.password_hash)) {
      res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' })
      return
    }

    res.json(issueAuthResponse(doc))
  })

  r.get('/me', requireAuth, async (req, res) => {
    const doc = await User.findById(req.auth.userId).lean()
    if (!doc) {
      res.status(401).json({ message: '사용자를 찾을 수 없습니다.' })
      return
    }
    res.json({ user: rowToPublicUser(doc) })
  })

  return r
}
