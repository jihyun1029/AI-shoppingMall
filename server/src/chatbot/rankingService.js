import { productMatchesColorTokens } from './colorFilter.js'
import { buildSearchTextFromRow } from './searchService.js'

function stripMeta(row) {
  const { _search_blob, ...rest } = row
  return rest
}

function satisfiesHardConstraints(row, f) {
  const r = stripMeta(row)
  if (Number(r.stock) <= 0) return false
  if (f.categories?.length && !f.categories.includes(String(r.category))) return false
  const salePrice = Number(r.salePrice)
  if (f.maxPrice != null && !Number.isNaN(f.maxPrice) && salePrice > f.maxPrice) return false
  if (f.minPrice != null && !Number.isNaN(f.minPrice) && salePrice < f.minPrice) return false
  if (f.colors?.length && !productMatchesColorTokens(r.colors, f.colors)) return false
  if (f.strictSubCategory && String(r.subCategory) !== String(f.strictSubCategory)) return false
  return true
}

export function filterByHardConstraints(rows, f) {
  return rows.filter((row) => satisfiesHardConstraints(row, f))
}

/**
 * @param {Record<string, unknown>} row
 * @param {ReturnType<import('./keywordParser.js').parseRagKeywords>} f
 */
export function scoreCandidate(row, f) {
  const r = stripMeta(row)
  let score = 0
  const cat = String(r.category || '')
  const st = buildSearchTextFromRow(r).toLowerCase()

  if (f.categories?.length && f.categories.includes(cat)) score += 5

  if (f.maxPrice != null && !Number.isNaN(f.maxPrice)) {
    const sp = Number(r.salePrice)
    if (sp <= f.maxPrice) score += 3
  } else {
    score += 1
  }

  const rating = Number(r.rating) || 0
  score += Math.min(5, rating * 0.85)

  const rc = Number(r.reviewCount) || 0
  score += Math.min(3, Math.log10(rc + 1) * 1.2)

  if (Number(r.isBest) === 1) score += 2
  if (Number(r.stock) > 0) score += 1

  for (const t of f.rawTokens || []) {
    if (t.length < 2) continue
    if (st.includes(t.toLowerCase())) score += 0.8
  }

  if (f.bodyType === '상체통통') {
    if (/루즈|오버핏|셔츠|블라우스|가디건/.test(st)) score += 2.3
    if (/브이넥|v넥|드롭/.test(st)) score += 1.1
  } else if (f.bodyType === '하체통통') {
    if (/와이드|세미\s*와이드|스트레이트|슬랙스|롱/.test(st)) score += 2.3
    if (/다크|블랙|네이비|차콜/.test(st)) score += 0.8
  } else if (f.bodyType === '어깨넓은') {
    if (/브이넥|v넥|드롭|루즈|가디건/.test(st)) score += 2.0
  } else if (f.bodyType === '골반넓은') {
    if (/와이드|세미\s*와이드|롱|슬랙스|코트/.test(st)) score += 2.0
  } else if (f.bodyType === '통통') {
    if (/와이드|세미\s*와이드|루즈|여유핏/.test(st)) score += 2.2
    if (/블랙|네이비|차콜|다크/.test(st)) score += 1.1
  } else if (f.bodyType === '마른') {
    if (/슬림|슬림핏|레이어드|가디건|니트/.test(st)) score += 2.0
  } else if (f.bodyType === '키작은') {
    if (/하이웨스트|크롭|미니|숏/.test(st)) score += 1.8
  } else if (f.bodyType === '키큰') {
    if (/롱|와이드|맥시|코트/.test(st)) score += 1.8
  }

  return Math.round(score * 10) / 10
}

/**
 * @param {Record<string, unknown>[]} rows
 * @param {ReturnType<import('./keywordParser.js').parseRagKeywords>} f
 */
export function rerank(rows, f) {
  const constrained = filterByHardConstraints(rows, f)
  const scored = constrained.map((row) => ({
    row: stripMeta(row),
    score: scoreCandidate(row, f),
  }))
  scored.sort((a, b) => b.score - a.score)
  return scored.map((x) => x.row)
}
