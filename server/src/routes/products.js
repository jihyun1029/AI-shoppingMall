import express from 'express'
import { normalizeAdminProductInput } from '../../../src/utils/productHelpers.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { reseedProducts } from '../seedDb.js'
import { rowToApiProduct, apiProductToInsertRow } from '../productRowMapper.js'
import { Product } from '../models/Product.js'

export function createProductsRouter() {
  const r = express.Router()

  r.get('/', async (_req, res) => {
    const docs = await Product.find().sort({ updatedAt: -1 }).lean()
    res.json({ products: docs.map(rowToApiProduct) })
  })

  r.post('/actions/reseed', requireAuth, requireAdmin, async (_req, res) => {
    await reseedProducts()
    const docs = await Product.find().sort({ updatedAt: -1 }).lean()
    res.json({ products: docs.map(rowToApiProduct) })
  })

  r.get('/:id', async (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) {
      res.status(404).json({ message: '상품을 찾을 수 없습니다.' })
      return
    }
    const doc = await Product.findOne({ id }).lean()
    if (!doc) {
      res.status(404).json({ message: '상품을 찾을 수 없습니다.' })
      return
    }
    res.json({ product: rowToApiProduct(doc) })
  })

  r.post('/', requireAuth, requireAdmin, async (req, res) => {
    let normalized
    try {
      normalized = normalizeAdminProductInput(req.body || {})
    } catch (e) {
      res.status(400).json({ message: e.message || '입력값을 확인해 주세요.' })
      return
    }

    const maxProduct = await Product.findOne({}, 'id').sort({ id: -1 }).lean()
    const nextId = (maxProduct?.id || 0) + 1
    const now = new Date().toISOString()
    const row = apiProductToInsertRow(normalized, String(nextId), now)

    const doc = await Product.create(row)
    res.status(201).json({ product: rowToApiProduct(doc.toObject()) })
  })

  r.put('/:id', requireAuth, requireAdmin, async (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) {
      res.status(404).json({ message: '상품을 찾을 수 없습니다.' })
      return
    }
    const existing = await Product.findOne({ id }).lean()
    if (!existing) {
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
      createdAt: existing.createdAt || normalized.createdAt,
    }

    const updated = await Product.findOneAndUpdate({ id }, merged, { new: true }).lean()
    res.json({ product: rowToApiProduct(updated) })
  })

  r.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    const id = Number(req.params.id)
    const result = await Product.deleteOne({ id })
    if (result.deletedCount === 0) {
      res.status(404).json({ message: '상품을 찾을 수 없습니다.' })
      return
    }
    res.status(204).end()
  })

  return r
}
