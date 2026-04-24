import { productMatchesColorTokens } from './colorFilter.js'

/**
 * DB 재조회 + 규칙 검증 (환각 방지: 응답 상품은 DB에 존재하는 행만)
 * @param {import('better-sqlite3').Database} db
 * @param {Record<string, unknown>[]} rows
 * @param {ReturnType<import('./keywordParser.js').parseRagKeywords>} f
 * @param {{ strictCategory?: boolean }} [opts]
 */
export function validateCandidates(db, rows, f, opts = {}) {
  const strictCategory = opts.strictCategory !== false
  const stmt = db.prepare('SELECT * FROM products WHERE id = ? AND stock > 0')
  const out = []
  const dropped = []

  for (const r of rows) {
    const id = Number(r.id)
    if (!Number.isFinite(id)) {
      dropped.push('invalid-id')
      continue
    }
    const fresh = stmt.get(id)
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
