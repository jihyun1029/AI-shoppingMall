export function formatPrice(value) {
  return new Intl.NumberFormat('ko-KR').format(value)
}

/** @param {{ price: number; originalPrice?: number }} product */
export function getDiscountPercent(product) {
  const orig = product.originalPrice
  if (!orig || orig <= product.price) return 0
  return Math.round((1 - product.price / orig) * 100)
}
