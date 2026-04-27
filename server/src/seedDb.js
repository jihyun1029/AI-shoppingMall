import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { User } from './models/User.js'
import { Product } from './models/Product.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const womenRowsPath = path.join(__dirname, '..', 'data', 'women_product_rows.json')

const ADMIN_EMAIL = 'admin@studio-line.com'
const ADMIN_PASSWORD = 'admin1234'

function loadWomenRows() {
  const raw = fs.readFileSync(womenRowsPath, 'utf8')
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('women_product_rows.json is missing or empty. Run: node scripts/generate-women-seed.mjs')
  }
  return parsed.map((row) => ({
    ...row,
    colors: typeof row.colors === 'string' ? JSON.parse(row.colors) : (row.colors || []),
    sizes: typeof row.sizes === 'string' ? JSON.parse(row.sizes) : (row.sizes || []),
    isNew: Boolean(row.isNew),
    isBest: Boolean(row.isBest),
  }))
}

export async function seedWomenProducts() {
  const rows = loadWomenRows()
  await Product.insertMany(rows, { ordered: false })
}

export async function seedAdminUser() {
  const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10)
  const now = new Date().toISOString()
  await User.create({
    _id: 'admin',
    email: ADMIN_EMAIL,
    password_hash: hash,
    name: '관리자',
    gender: 'unknown',
    role: 'admin',
    created_at: now,
  })
}

export async function seedIfEmpty() {
  const userCount = await User.countDocuments()
  if (userCount === 0) await seedAdminUser()

  const productCount = await Product.countDocuments()
  if (productCount === 0) await seedWomenProducts()
}

export async function reseedProducts() {
  await Product.deleteMany({})
  await seedWomenProducts()
}
