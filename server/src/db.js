import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { migrateProductsTable } from './productSchema.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

export function openDatabase() {
  const filePath =
    process.env.DATABASE_PATH ||
    path.join(__dirname, '..', 'data', 'shop.db')
  ensureDir(path.dirname(filePath))
  const db = new Database(filePath)
  db.pragma('journal_mode = WAL')
  return db
}

export function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      gender TEXT NOT NULL DEFAULT 'unknown',
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL
    );
  `)
  migrateProductsTable(db)
}
