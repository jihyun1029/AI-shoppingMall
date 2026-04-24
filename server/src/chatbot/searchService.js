import { preferredSubCategoriesForStyle, semanticExpansionTerms } from './keywordParser.js'

const CANDIDATE_LIMIT = 18
const MERGE_CAP = 22

/** SQLite에서 사용할 검색용 텍스트 표현식 (컬럼 추가 없이 인덱싱 가능) */
export function searchBlobExpression() {
  return `lower(brand || ' ' || name || ' ' || ifnull(category,'') || ' ' || ifnull(subCategory,'') || ' ' || ifnull(colors,'') || ' ' || ifnull(description,''))`
}

/**
 * Contextual Retrieval: 행 단위 searchText (오프라인 설명·재랭킹·로그용)
 * @param {Record<string, unknown>} row
 */
export function buildSearchTextFromRow(row) {
  let colors = ''
  try {
    const arr = JSON.parse(String(row.colors || '[]'))
    if (Array.isArray(arr)) colors = arr.join(' ')
  } catch {
    colors = String(row.colors || '')
  }
  const styleHints = inferStyleHintsFromRow(row)
  return [
    `브랜드 ${row.brand}`,
    String(row.name),
    `카테고리 ${row.category}`,
    `서브 ${row.subCategory}`,
    colors && `색상 ${colors}`,
    styleHints.length && `스타일 ${styleHints.join(' ')}`,
    String(row.description || ''),
  ]
    .filter(Boolean)
    .join(', ')
}

function inferStyleHintsFromRow(row) {
  const sub = String(row.subCategory || '')
  const cat = String(row.category || '')
  const hints = []
  if (['블라우스', '셔츠', '슬랙스', '자켓', '코트', '로퍼'].some((x) => sub.includes(x) || sub === x)) {
    hints.push('출근룩')
  }
  if (['반팔티', '데님', '니트', '가디건', '스니커즈', '후드'].some((x) => sub.includes(x) || sub === x)) {
    hints.push('데일리룩')
  }
  if (['원피스', '스커트', '힐'].some((x) => sub.includes(x) || sub === x) || cat === 'dress') {
    hints.push('데이트룩', '페미닌')
  }
  return [...new Set(hints)]
}

/**
 * colors JSON 컬럼에 대해 동의어 OR 필터 (필수 조건)
 * @param {string[]} parts
 * @param {unknown[]} vals
 * @param {ReturnType<import('./keywordParser.js').parseRagKeywords>} f
 */
export function appendColorWhere(parts, vals, f) {
  if (!f.colors?.length) return
  const ors = f.colors.map(() => 'colors LIKE ?')
  parts.push(`(${ors.join(' OR ')})`)
  for (const c of f.colors) {
    vals.push(`%"${c}"%`)
  }
}

function orderClauseStructured(f, pref) {
  const parts = []
  const extraVals = []
  if (f.popular) parts.push('isBest DESC')
  if (pref.length) {
    const inner = pref.map(() => 'WHEN subCategory = ? THEN 1').join(' ')
    parts.push('(CASE ' + inner + ' ELSE 0 END) DESC')
    extraVals.push(...pref)
  }
  parts.push('rating DESC', 'reviewCount DESC')
  return { sql: parts.join(', '), extraVals }
}

/**
 * (1) 구조화 키워드 검색
 * @param {import('better-sqlite3').Database} db
 * @param {ReturnType<import('./keywordParser.js').parseRagKeywords>} f
 */
export function keywordStructuredSearch(db, f) {
  const where = ['stock > 0']
  const vals = []

  if (f.categories?.length) {
    where.push(`category IN (${f.categories.map(() => '?').join(',')})`)
    vals.push(...f.categories)
  }

  if (f.subCategories?.length) {
    const ors = f.subCategories.map(() => '(subCategory = ? OR name LIKE ? OR description LIKE ?)')
    for (const sub of f.subCategories) {
      vals.push(sub, `%${sub}%`, `%${sub}%`)
    }
    where.push(`(${ors.join(' OR ')})`)
  }

  appendColorWhere(where, vals, f)

  if (f.maxPrice != null && !Number.isNaN(f.maxPrice)) {
    where.push('salePrice <= ?')
    vals.push(f.maxPrice)
  }
  if (f.minPrice != null && !Number.isNaN(f.minPrice)) {
    where.push('salePrice >= ?')
    vals.push(f.minPrice)
  }

  const pref = preferredSubCategoriesForStyle(f.styleKeyword || '')
  const { sql: orderSql, extraVals } = orderClauseStructured(f, pref)
  const allVals = [...vals, ...extraVals]
  const blob = searchBlobExpression()

  const sql = `
    SELECT *, ${blob} AS _search_blob
    FROM products
    WHERE ${where.join(' AND ')}
    ORDER BY ${orderSql}
    LIMIT ${CANDIDATE_LIMIT}
  `.trim()

  return db.prepare(sql).all(...allVals)
}

/**
 * (2) 스타일 확장 키워드로 search blob LIKE (의미 기반 간이 확장)
 */
export function semanticExpandedSearch(db, f) {
  const terms = semanticExpansionTerms(f.styleKeyword)
  if (!terms.length) return []

  const blob = searchBlobExpression()
  const ors = terms.map(() => `${blob} LIKE ?`)
  const vals = terms.map((t) => `%${String(t).toLowerCase()}%`)

  const where = ['stock > 0', `(${ors.join(' OR ')})`]
  if (f.maxPrice != null && !Number.isNaN(f.maxPrice)) {
    where.push('salePrice <= ?')
    vals.push(f.maxPrice)
  }
  if (f.minPrice != null && !Number.isNaN(f.minPrice)) {
    where.push('salePrice >= ?')
    vals.push(f.minPrice)
  }
  if (f.categories?.length) {
    where.push(`category IN (${f.categories.map(() => '?').join(',')})`)
    vals.push(...f.categories)
  }

  appendColorWhere(where, vals, f)

  const sql = `
    SELECT *, ${blob} AS _search_blob
    FROM products
    WHERE ${where.join(' AND ')}
    ORDER BY isBest DESC, rating DESC, reviewCount DESC
    LIMIT ${CANDIDATE_LIMIT}
  `.trim()

  return db.prepare(sql).all(...vals)
}

function mergeById(a, b) {
  const map = new Map()
  for (const r of [...a, ...b]) {
    if (!r?.id) continue
    if (!map.has(r.id)) map.set(r.id, r)
  }
  return [...map.values()].slice(0, MERGE_CAP)
}

export function searchRelaxedBlob(db, f) {
  const blob = searchBlobExpression()
  const tok = (f.rawTokens || []).filter((t) => t.length >= 2).slice(0, 5)
  if (!tok.length) return []
  const ors = tok.map(() => `${blob} LIKE ?`)
  const vals = tok.map((t) => `%${t.toLowerCase()}%`)
  const where = ['stock > 0', `(${ors.join(' OR ')})`]
  if (f.maxPrice != null && !Number.isNaN(f.maxPrice)) {
    where.push('salePrice <= ?')
    vals.push(f.maxPrice)
  }
  if (f.minPrice != null && !Number.isNaN(f.minPrice)) {
    where.push('salePrice >= ?')
    vals.push(f.minPrice)
  }
  if (f.categories?.length) {
    where.push(`category IN (${f.categories.map(() => '?').join(',')})`)
    vals.push(...f.categories)
  }
  appendColorWhere(where, vals, f)
  const sql = `
    SELECT *, ${blob} AS _search_blob
    FROM products
    WHERE ${where.join(' AND ')}
    ORDER BY isBest DESC, rating DESC, reviewCount DESC
    LIMIT ${CANDIDATE_LIMIT}
  `.trim()
  return db.prepare(sql).all(...vals)
}

export function searchPopularFallback(db) {
  const blob = searchBlobExpression()
  return db
    .prepare(
      `
    SELECT *, ${blob} AS _search_blob
    FROM products
    WHERE stock > 0
    ORDER BY isBest DESC, rating DESC, reviewCount DESC
    LIMIT 8
  `.trim(),
    )
    .all()
}

export function searchConstrainedFallback(db, f) {
  const blob = searchBlobExpression()
  const where = ['stock > 0']
  const vals = []
  if (f.categories?.length) {
    where.push(`category IN (${f.categories.map(() => '?').join(',')})`)
    vals.push(...f.categories)
  }
  if (f.maxPrice != null && !Number.isNaN(f.maxPrice)) {
    where.push('salePrice <= ?')
    vals.push(f.maxPrice)
  }
  if (f.minPrice != null && !Number.isNaN(f.minPrice)) {
    where.push('salePrice >= ?')
    vals.push(f.minPrice)
  }
  appendColorWhere(where, vals, f)
  const sql = `
    SELECT *, ${blob} AS _search_blob
    FROM products
    WHERE ${where.join(' AND ')}
    ORDER BY isBest DESC, rating DESC, reviewCount DESC
    LIMIT 8
  `.trim()
  return db.prepare(sql).all(...vals)
}

export function searchByCartContext(db, ids, f = null) {
  if (!ids?.length) return []
  const nums = ids.map((id) => Number(id)).filter((n) => Number.isFinite(n))
  if (!nums.length) return []
  const ph = nums.map(() => '?').join(',')
  const blob = searchBlobExpression()
  const catRows = db.prepare(`SELECT DISTINCT category FROM products WHERE id IN (${ph}) AND stock > 0`).all(...nums)
  const cats = catRows.map((r) => r.category).filter(Boolean)
  if (!cats.length) return []
  const cph = cats.map(() => '?').join(',')
  const where = [`stock > 0`, `category IN (${cph})`, `id NOT IN (${ph})`]
  const vals = [...cats, ...nums]
  appendColorWhere(where, vals, f || {})
  const sql = `
    SELECT *, ${blob} AS _search_blob
    FROM products
    WHERE ${where.join(' AND ')}
    ORDER BY isBest DESC, rating DESC, reviewCount DESC
    LIMIT 8
  `.trim()
  return db.prepare(sql).all(...vals)
}

/**
 * Hybrid: 구조화 검색 ∪ 스타일 확장 검색 → 후보 통합
 */
export function hybridSearch(db, f) {
  const a = keywordStructuredSearch(db, f)
  const b = semanticExpandedSearch(db, f)
  let merged = mergeById(a, b)
  if (merged.length < 6) {
    const c = searchRelaxedBlob(db, f)
    merged = mergeById(merged, c)
  }
  return merged
}
