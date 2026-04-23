const COUPONS = {
  WELCOME10: { percent: 10, label: '웰컴 10%' },
  LINE5000: { fixed: 5000, label: '5,000원 할인' },
}

/**
 * @param {string} code
 * @param {number} subtotal
 */
export function evaluateCoupon(code, subtotal) {
  const key = code.trim().toUpperCase()
  const c = COUPONS[key]
  if (!c) return { ok: false, discount: 0, label: '' }
  if (c.percent != null) {
    const discount = Math.floor((subtotal * c.percent) / 100)
    return { ok: true, discount, label: c.label, code: key }
  }
  if (c.fixed != null) {
    const discount = Math.min(c.fixed, subtotal)
    return { ok: true, discount, label: c.label, code: key }
  }
  return { ok: false, discount: 0, label: '' }
}

export const COUPON_HINTS = Object.keys(COUPONS).join(', ')
