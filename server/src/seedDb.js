import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

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
  return parsed
}

/** @param {import('better-sqlite3').Database} db */
export function seedWomenProducts(db) {
  const rows = loadWomenRows()
  const insert = db.prepare(`
    INSERT INTO products (
      id, brand, name, category, subCategory, price, discountRate, salePrice,
      colors, sizes, gender, rating, reviewCount, stock, isNew, isBest,
      image, description, createdAt, updatedAt
    ) VALUES (
      @id, @brand, @name, @category, @subCategory, @price, @discountRate, @salePrice,
      @colors, @sizes, @gender, @rating, @reviewCount, @stock, @isNew, @isBest,
      @image, @description, @createdAt, @updatedAt
    )
  `)
  const tx = db.transaction(() => {
    for (const r of rows) {
      insert.run(r)
    }
  })
  tx()
}

export function seedAdminUser(db) {
  const id = 'admin'
  const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10)
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO users (id, email, password_hash, name, gender, role, created_at)
     VALUES (@id, @email, @password_hash, @name, @gender, @role, @created_at)`,
  ).run({
    id,
    email: ADMIN_EMAIL,
    password_hash: hash,
    name: '관리자',
    gender: 'unknown',
    role: 'admin',
    created_at: now,
  })
}

export function seedIfEmpty(db) {
  const userCount = db.prepare(`SELECT COUNT(*) AS c FROM users`).get().c
  if (userCount === 0) seedAdminUser(db)

  const productCount = db.prepare(`SELECT COUNT(*) AS c FROM products`).get().c
  if (productCount === 0) seedWomenProducts(db)
}

export function reseedProducts(db) {
  db.prepare(`DELETE FROM products`).run()
  seedWomenProducts(db)
}
