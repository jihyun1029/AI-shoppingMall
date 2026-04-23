import express from 'express'
import { normalizeAdminProductInput } from '../../../src/utils/productHelpers.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { reseedProducts } from '../seedDb.js'
import { rowToApiProduct, apiProductToInsertRow } from '../productRowMapper.js'

export function createProductsRouter(db) {
  const r = express.Router()

  r.get('/', (_req, res) => {
    const rows = db.prepare(`SELECT * FROM products ORDER BY updatedAt DESC`).all()
    const products = rows.map(rowToApiProduct)
    res.json({ products })
  })

  r.post('/actions/reseed', requireAuth, requireAdmin, (_req, res) => {
    reseedProducts(db)
    const rows = db.prepare(`SELECT * FROM products ORDER BY updatedAt DESC`).all()
    res.json({ products: rows.map(rowToApiProduct) })
  })

  r.get('/:id', (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) {
      res.status(404).json({ message: '상품을 찾을 수 없습니다.' })
      return
    }
    const row = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id)
    if (!row) {
      res.status(404).json({ message: '상품을 찾을 수 없습니다.' })
      return
    }
    res.json({ product: rowToApiProduct(row) })
  })

  r.post('/', requireAuth, requireAdmin, (req, res) => {
    let normalized
    try {
      normalized = normalizeAdminProductInput(req.body || {})
    } catch (e) {
      res.status(400).json({ message: e.message || '입력값을 확인해 주세요.' })
      return
    }

    const nextId = db.prepare(`SELECT COALESCE(MAX(id), 0) + 1 AS n FROM products`).get().n
    const now = new Date().toISOString()
    const row = apiProductToInsertRow(normalized, String(nextId), now)

    db.prepare(
      `INSERT INTO products (
        id, brand, name, category, subCategory, price, discountRate, salePrice,
        colors, sizes, gender, rating, reviewCount, stock, isNew, isBest,
        image, description, createdAt, updatedAt
      ) VALUES (
        @id, @brand, @name, @category, @subCategory, @price, @discountRate, @salePrice,
        @colors, @sizes, @gender, @rating, @reviewCount, @stock, @isNew, @isBest,
        @image, @description, @createdAt, @updatedAt
      )`,
    ).run(row)

    const inserted = db.prepare(`SELECT * FROM products WHERE id = ?`).get(nextId)
    const product = rowToApiProduct(inserted)
    res.status(201).json({ product })
  })

  r.put('/:id', requireAuth, requireAdmin, (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) {
      res.status(404).json({ message: '상품을 찾을 수 없습니다.' })
      return
    }
    const existingRow = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id)
    if (!existingRow) {
      res.status(404).json({ message: '상품을 찾을 수 없습니다.' })
      return
    }

    let normalized
    try {
      normalized = normalizeAdminProductInput(req.body || {})
    } catch (e) {
      res.status(400).json({ message: e.message || '입력값을 확인해 주세요.' })
      return
    }

    const now = new Date().toISOString()
    const merged = {
      ...apiProductToInsertRow(normalized, String(id), now),
      id,
      createdAt: existingRow.createdAt || normalized.createdAt,
    }

    db.prepare(
      `UPDATE products SET
        brand = @brand,
        name = @name,
        category = @category,
        subCategory = @subCategory,
        price = @price,
        discountRate = @discountRate,
        salePrice = @salePrice,
        colors = @colors,
        sizes = @sizes,
        gender = @gender,
        rating = @rating,
        reviewCount = @reviewCount,
        stock = @stock,
        isNew = @isNew,
        isBest = @isBest,
        image = @image,
        description = @description,
        createdAt = @createdAt,
        updatedAt = @updatedAt
      WHERE id = @id`,
    ).run(merged)

    const updated = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id)
    res.json({ product: rowToApiProduct(updated) })
  })

  r.delete('/:id', requireAuth, requireAdmin, (req, res) => {
    const id = Number(req.params.id)
    const info = db.prepare(`DELETE FROM products WHERE id = ?`).run(id)
    if (info.changes === 0) {
      res.status(404).json({ message: '상품을 찾을 수 없습니다.' })
      return
    }
    res.status(204).end()
  })

  return r
}
