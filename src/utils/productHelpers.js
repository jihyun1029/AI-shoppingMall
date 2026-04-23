import { SHOP_CATEGORIES, SUBCATEGORY_OPTIONS } from '../data/products.js'

export const PRODUCT_STORAGE_KEY = 'studio-line-products-v2'

export function slugBrand(brand) {
  const s = String(brand || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return s || 'brand'
}

export function categoryLabelToCode(label) {
  const found = SHOP_CATEGORIES.find((c) => c.label === label)
  return found?.id ?? label
}

export function codeToCategoryLabel(code) {
  return SHOP_CATEGORIES.find((c) => c.id === code)?.label ?? code
}

export function isValidSubCategory(categoryCode, subCategory) {
  const options = SUBCATEGORY_OPTIONS[categoryCode] ?? []
  return options.includes(subCategory)
}

export function toColorObjects(colorList) {
  return colorList.map((name) => {
    const hex = COLOR_PRESET[name] ?? fallbackColor(name)
    return { id: slugBrand(name), name, hex }
  })
}

function fallbackColor(name) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  const hue = Math.abs(h) % 360
  return `hsl(${hue}, 22%, 42%)`
}

const COLOR_PRESET = {
  블랙: '#171717',
  화이트: '#fafafa',
  아이보리: '#fafaf9',
  크림: '#fef9c3',
  네이비: '#1e3a5f',
  차콜: '#374151',
  그레이: '#9ca3af',
  다크그레이: '#4b5563',
  베이지: '#d6d3d1',
  브라운: '#78350f',
  카키: '#57534e',
  올리브: '#3f3f46',
  버건디: '#7f1d1d',
  와인: '#7f1d1d',
  블루: '#2563eb',
  라이트블루: '#93c5fd',
  인디고: '#312e81',
  실버: '#d4d4d8',
}

export function normalizeAdminProductInput(input) {
  const category = input.category
  const price = Number(input.price)
  const discountRate = Number(input.discountRate)
  const salePrice = Math.max(0, Math.round(price * (100 - discountRate) / 100))
  const images = [String(input.image || '').trim(), String(input.imageAlt || '').trim()].filter(
    Boolean,
  )

  const colors = parseList(input.colors)
  const sizes = parseList(input.sizes)

  return {
    brand: String(input.brand || '').trim(),
    brandId: slugBrand(input.brand),
    name: String(input.name || '').trim(),
    category,
    subCategory: String(input.subCategory || '').trim(),
    price: salePrice,
    originalPrice: discountRate > 0 ? price : undefined,
    discountRate,
    salePrice,
    image: images[0] || '',
    images: images.length ? images : [''],
    colors: toColorObjects(colors),
    sizes,
    gender: String(input.gender || 'unisex'),
    rating: Number(input.rating || 4.5),
    reviewCount: Number(input.reviewCount || 0),
    stock: Number(input.stock || 0),
    isNew: Boolean(input.isNew),
    isBest: Boolean(input.isBest),
    description: String(input.description || '').trim(),
    material: String(input.material || '소재 정보는 준비 중입니다.').trim(),
    care: String(input.care || '세탁 라벨을 확인해 주세요.').trim(),
    shipping: String(input.shipping || '영업일 기준 2~4일 이내 출고 (데모)').trim(),
    popularity: Math.min(
      99,
      Math.round(
        Number(input.rating || 4.5) * 14 +
          Number(input.reviewCount || 0) / 30 +
          (input.isBest ? 8 : 0),
      ),
    ),
    createdAt: String(input.createdAt || new Date().toISOString().slice(0, 10)),
  }
}

function parseList(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean)
  return String(value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}
