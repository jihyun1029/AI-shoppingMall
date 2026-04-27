import { Product } from '../models/Product.js'
import { preferredSubCategoriesForStyle, semanticExpansionTerms } from './keywordParser.js'

const CANDIDATE_LIMIT = 18
const MERGE_CAP = 22

/**
 * Contextual Retrieval: 행 단위 searchText (오프라인 설명·재랭킹·로그용)
 * @param {Record<string, unknown>} row
 */
export function buildSearchTextFromRow(row) {
  const colors = Array.isArray(row.colors) ? row.colors.join(' ') : String(row.colors || '')
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

function buildBaseQuery(f) {
  const q = { stock: { $gt: 0 } }

  if (f.categories?.length) q.category = { $in: f.categories }

  if (f.strictSubCategory) {
    q.subCategory = f.strictSubCategory
  } else if (f.subCategories?.length) {
    const regexes = f.subCategories.map((s) => new RegExp(s, 'i'))
    q.$or = [
      { subCategory: { $in: f.subCategories } },
      { name: { $in: regexes } },
      { description: { $in: regexes } },
    ]
  }

  if (f.colors?.length) {
    q.colors = { $in: f.colors.map((c) => new RegExp(`^${c}$`, 'i')) }
  }

  if (f.maxPrice != null && !Number.isNaN(f.maxPrice)) {
    q.salePrice = { ...q.salePrice, $lte: f.maxPrice }
  }
  if (f.minPrice != null && !Number.isNaN(f.minPrice)) {
    q.salePrice = { ...q.salePrice, $gte: f.minPrice }
  }

  return q
}

function sortByPreferred(docs, f) {
  const pref = preferredSubCategoriesForStyle(f.styleKeyword || '')
  if (!pref.length && !f.popular) return docs
  return [...docs].sort((a, b) => {
    if (f.popular) {
      const diff = (b.isBest ? 1 : 0) - (a.isBest ? 1 : 0)
      if (diff !== 0) return diff
    }
    if (pref.length) {
      const ap = pref.includes(a.subCategory) ? 1 : 0
      const bp = pref.includes(b.subCategory) ? 1 : 0
      if (ap !== bp) return bp - ap
    }
    if (b.rating !== a.rating) return b.rating - a.rating
    return b.reviewCount - a.reviewCount
  })
}

/**
 * (1) 구조화 키워드 검색
 * @param {ReturnType<import('./keywordParser.js').parseRagKeywords>} f
 */
export async function keywordStructuredSearch(f) {
  const q = buildBaseQuery(f)
  const docs = await Product.find(q)
    .sort({ isBest: -1, rating: -1, reviewCount: -1 })
    .limit(CANDIDATE_LIMIT)
    .lean()
  return sortByPreferred(docs, f)
}

/**
 * (2) 스타일 확장 키워드로 regex 검색 (의미 기반 간이 확장)
 */
export async function semanticExpandedSearch(f) {
  if (f.strictSubCategory) return []
  const terms = semanticExpansionTerms(f.styleKeyword)
  if (!terms.length) return []

  const regexes = terms.map((t) => new RegExp(t, 'i'))
  const q = {
    stock: { $gt: 0 },
    $or: [
      { brand: { $in: regexes } },
      { name: { $in: regexes } },
      { subCategory: { $in: regexes } },
      { description: { $in: regexes } },
      { colors: { $in: regexes } },
    ],
  }
  if (f.maxPrice != null && !Number.isNaN(f.maxPrice)) q.salePrice = { $lte: f.maxPrice }
  if (f.minPrice != null && !Number.isNaN(f.minPrice)) q.salePrice = { ...q.salePrice, $gte: f.minPrice }
  if (f.categories?.length) q.category = { $in: f.categories }
  if (f.strictSubCategory) q.subCategory = f.strictSubCategory
  if (f.colors?.length) q.colors = { $in: f.colors.map((c) => new RegExp(`^${c}$`, 'i')) }

  return Product.find(q).sort({ isBest: -1, rating: -1, reviewCount: -1 }).limit(CANDIDATE_LIMIT).lean()
}

export async function searchRelaxedBlob(f) {
  const tok = (f.rawTokens || []).filter((t) => t.length >= 2).slice(0, 5)
  if (!tok.length) return []

  const regexes = tok.map((t) => new RegExp(t, 'i'))
  const q = {
    stock: { $gt: 0 },
    $or: [
      { brand: { $in: regexes } },
      { name: { $in: regexes } },
      { subCategory: { $in: regexes } },
      { description: { $in: regexes } },
      { colors: { $in: regexes } },
    ],
  }
  if (f.maxPrice != null && !Number.isNaN(f.maxPrice)) q.salePrice = { $lte: f.maxPrice }
  if (f.minPrice != null && !Number.isNaN(f.minPrice)) q.salePrice = { ...q.salePrice, $gte: f.minPrice }
  if (f.categories?.length) q.category = { $in: f.categories }
  if (f.strictSubCategory) q.subCategory = f.strictSubCategory
  if (f.colors?.length) q.colors = { $in: f.colors.map((c) => new RegExp(`^${c}$`, 'i')) }

  return Product.find(q).sort({ isBest: -1, rating: -1, reviewCount: -1 }).limit(CANDIDATE_LIMIT).lean()
}

export async function searchPopularFallback() {
  return Product.find({ stock: { $gt: 0 } })
    .sort({ isBest: -1, rating: -1, reviewCount: -1 })
    .limit(8)
    .lean()
}

export async function searchConstrainedFallback(f) {
  const q = { stock: { $gt: 0 } }
  if (f.categories?.length) q.category = { $in: f.categories }
  if (f.maxPrice != null && !Number.isNaN(f.maxPrice)) q.salePrice = { $lte: f.maxPrice }
  if (f.minPrice != null && !Number.isNaN(f.minPrice)) q.salePrice = { ...q.salePrice, $gte: f.minPrice }
  if (f.strictSubCategory) q.subCategory = f.strictSubCategory
  if (f.colors?.length) q.colors = { $in: f.colors.map((c) => new RegExp(`^${c}$`, 'i')) }

  return Product.find(q).sort({ isBest: -1, rating: -1, reviewCount: -1 }).limit(8).lean()
}

export async function searchByCartContext(ids, f = null) {
  if (!ids?.length) return []
  const nums = ids.map((id) => Number(id)).filter((n) => Number.isFinite(n))
  if (!nums.length) return []

  const cartProducts = await Product.find(
    { id: { $in: nums }, stock: { $gt: 0 } },
    'category',
  ).lean()
  const cats = [...new Set(cartProducts.map((d) => d.category))].filter(Boolean)
  if (!cats.length) return []

  const q = { stock: { $gt: 0 }, category: { $in: cats }, id: { $nin: nums } }
  if (f?.strictSubCategory) q.subCategory = f.strictSubCategory
  if (f?.colors?.length) q.colors = { $in: f.colors.map((c) => new RegExp(`^${c}$`, 'i')) }

  return Product.find(q).sort({ isBest: -1, rating: -1, reviewCount: -1 }).limit(8).lean()
}

function mergeById(a, b) {
  const map = new Map()
  for (const r of [...a, ...b]) {
    if (!r?.id) continue
    if (!map.has(r.id)) map.set(r.id, r)
  }
  return [...map.values()].slice(0, MERGE_CAP)
}

/**
 * Hybrid: 구조화 검색 ∪ 스타일 확장 검색 → 후보 통합
 */
export async function hybridSearch(f) {
  const a = await keywordStructuredSearch(f)
  const b = f.strictSubCategory ? [] : await semanticExpandedSearch(f)
  let merged = mergeById(a, b)
  if (merged.length < 6) {
    const c = await searchRelaxedBlob(f)
    merged = mergeById(merged, c)
  }
  return merged
}
