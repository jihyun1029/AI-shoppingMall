import { productMatchesColorTokens } from './colorFilter.js'
import { Product } from '../models/Product.js'

/**
 * DB 재조회 + 규칙 검증 (환각 방지: 응답 상품은 DB에 존재하는 행만)
 * @param {Record<string, unknown>[]} rows
 * @param {ReturnType<import('./keywordParser.js').parseRagKeywords>} f
 * @param {{ strictCategory?: boolean }} [opts]
 */
export async function validateCandidates(rows, f, opts = {}) {
  const strictCategory = opts.strictCategory !== false
  const out = []
  const dropped = []

  for (const r of rows) {
    const id = Number(r.id)
    if (!Number.isFinite(id)) {
      dropped.push('invalid-id')
      continue
    }
    const fresh = await Product.findOne({ id, stock: { $gt: 0 } }).lean()
    if (!fresh) {
      dropped.push(`missing-${id}`)
      continue
    }
    if (f.maxPrice != null && !Number.isNaN(f.maxPrice) && Number(fresh.salePrice) > f.maxPrice) {
      dropped.push(`price-${id}`)
      continue
    }
    if (f.minPrice != null && !Number.isNaN(f.minPrice) && Number(fresh.salePrice) < f.minPrice) {
      dropped.push(`price-${id}`)
      continue
    }
    if (strictCategory && f.categories?.length && !f.categories.includes(String(fresh.category))) {
      dropped.push(`category-${id}`)
      continue
    }
    if (f.colors?.length && !productMatchesColorTokens(fresh.colors, f.colors)) {
      dropped.push(`color-${id}`)
      continue
    }
    if (f.strictSubCategory && String(fresh.subCategory) !== String(f.strictSubCategory)) {
      dropped.push(`sub-${id}`)
      continue
    }
    out.push(fresh)
  }

  return {
    rows: out,
    meta: {
      droppedCount: dropped.length,
      droppedReasons: dropped.slice(0, 8),
    },
  }
}
