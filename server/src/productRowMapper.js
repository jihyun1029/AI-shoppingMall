import { slugBrand, toColorObjects } from '../../src/utils/productHelpers.js'

/**
 * SQLite `products` 행 → 프론트엔드가 기대하는 상품 객체
 * @param {Record<string, unknown>} row
 */
export function rowToApiProduct(row) {
  const colorsArr = safeJsonArray(row.colors, [])
  const sizesArr = safeJsonArray(row.sizes, [])
  const listPrice = Number(row.price)
  const discountRate = Number(row.discountRate) || 0
  const salePrice = Number(row.salePrice)
  const brand = String(row.brand || '')
  const rating = Number(row.rating) || 4.5
  const reviewCount = Number(row.reviewCount) || 0
  const isNew = Number(row.isNew) === 1
  const isBest = Number(row.isBest) === 1

  return {
    id: String(row.id),
    brand,
    brandId: slugBrand(brand),
    name: String(row.name || ''),
    category: String(row.category || ''),
    subCategory: String(row.subCategory || ''),
    price: salePrice,
    originalPrice: discountRate > 0 ? listPrice : undefined,
    discountRate,
    salePrice,
    image: String(row.image || ''),
    images: row.image ? [String(row.image)] : [''],
    colors: toColorObjects(colorsArr),
    sizes: sizesArr,
    gender: String(row.gender || 'female'),
    rating,
    reviewCount,
    stock: Number(row.stock) || 0,
    isNew,
    isBest,
    description: String(row.description || ''),
    material: '표기된 소재 혼용률을 참고해 주세요. (데모 데이터)',
    care: '세탁 라벨을 확인한 뒤 단독 세탁을 권장합니다.',
    shipping: '영업일 기준 2~4일 이내 출고 (데모)',
    popularity: Math.min(
      99,
      Math.round(rating * 14 + reviewCount / 30 + (isBest ? 8 : 0) + (isNew ? 4 : 0)),
    ),
    createdAt: String(row.createdAt || '').slice(0, 10),
  }
}

/**
 * 관리자 폼 정규화 결과 → SQLite INSERT 파라미터
 * @param {object} normalized normalizeAdminProductInput 결과
 * @param {string} id
 * @param {string} nowIso
 */
export function apiProductToInsertRow(normalized, id, nowIso) {
  const listPrice =
    normalized.discountRate > 0 && normalized.originalPrice != null
      ? Number(normalized.originalPrice)
      : Number(normalized.salePrice)
  const colorsJson = JSON.stringify((normalized.colors || []).map((c) => c.name))
  const sizesJson = JSON.stringify(normalized.sizes || [])
  return {
    id: Number(id),
    brand: normalized.brand,
    name: normalized.name,
    category: normalized.category,
    subCategory: normalized.subCategory,
    price: listPrice,
    discountRate: normalized.discountRate,
    salePrice: normalized.salePrice,
    colors: colorsJson,
    sizes: sizesJson,
    gender: normalized.gender,
    rating: normalized.rating,
    reviewCount: normalized.reviewCount,
    stock: normalized.stock,
    isNew: normalized.isNew ? 1 : 0,
    isBest: normalized.isBest ? 1 : 0,
    image: normalized.image || (normalized.images && normalized.images[0]) || '',
    description: normalized.description,
    createdAt: normalized.createdAt || nowIso.slice(0, 10),
    updatedAt: nowIso,
  }
}

function safeJsonArray(value, fallback) {
  if (Array.isArray(value)) return value.map(String)
  try {
    const v = JSON.parse(String(value || '[]'))
    return Array.isArray(v) ? v.map(String) : fallback
  } catch {
    return fallback
  }
}
