export const FREE_SHIPPING_THRESHOLD = 80000
export const DEFAULT_SHIPPING_FEE = 3500

export function getShippingFee(subtotal) {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0
  return DEFAULT_SHIPPING_FEE
}
