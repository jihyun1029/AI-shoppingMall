import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { OrderSummary } from '../components/OrderSummary'
import { getShippingFee } from '../utils/shipping'
import { evaluateCoupon, COUPON_HINTS } from '../utils/coupon'
import { formatPrice } from '../utils/format'
import { useAuth } from '../hooks/useAuth'

export function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [coupon, setCoupon] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [error, setError] = useState('')

  const shipping = getShippingFee(totalPrice)
  const couponResult = appliedCoupon
    ? evaluateCoupon(appliedCoupon, totalPrice)
    : { ok: false, discount: 0, label: '' }
  const discount = couponResult.ok ? couponResult.discount : 0
  const total = Math.max(0, totalPrice + shipping - discount)

  useEffect(() => {
    if (!user) return
    queueMicrotask(() => {
      if (!name) setName(user.name ?? '')
    })
  }, [user, name])

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-semibold text-zinc-900">주문할 상품이 없습니다</h1>
        <Link to="/shop" className="mt-6 inline-block text-sm font-medium underline">
          쇼핑하러 가기
        </Link>
      </div>
    )
  }

  const rows = items.map((line) => ({
    title: line.product.name,
    sub: `${line.colorLabel} / ${line.size}`,
    qty: line.quantity,
    linePrice: line.product.price * line.quantity,
  }))

  const handleApplyCoupon = () => {
    const res = evaluateCoupon(coupon, totalPrice)
    if (!res.ok) {
      setError(`사용할 수 없는 쿠폰입니다. (${COUPON_HINTS})`)
      setAppliedCoupon(null)
      return
    }
    setError('')
    setAppliedCoupon(coupon.trim().toUpperCase())
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const n = name.trim()
    const a = address.trim()
    if (!n || !a) {
      setError('이름과 배송지를 입력해 주세요.')
      return
    }
    setError('')
    const snapshot = items.map((line) => ({
      name: line.product.name,
      brand: line.product.brand,
      color: line.colorLabel,
      size: line.size,
      qty: line.quantity,
      price: line.product.price,
      image: line.product.images[0],
    }))
    clearCart()
    navigate('/order-complete', {
      replace: true,
      state: {
        customerName: n,
        phone: phone.trim(),
        address: a,
        subtotal: totalPrice,
        shipping,
        discount,
        total,
        coupon: appliedCoupon,
        items: snapshot,
      },
    })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">주문서</h1>
      <p className="mt-1 text-sm text-zinc-500">
        결제 연동 없이 주문 완료까지만 시뮬레이션합니다.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <section className="space-y-6 lg:col-span-7">
          <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}
            <div>
              <label htmlFor="nm" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                이름
              </label>
              <input
                id="nm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-zinc-900"
                placeholder="홍길동"
              />
            </div>
            <div>
              <label htmlFor="ph" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                연락처 (선택)
              </label>
              <input
                id="ph"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-zinc-900"
                placeholder="010-0000-0000"
              />
            </div>
            <div>
              <label htmlFor="addr" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                배송지
              </label>
              <textarea
                id="addr"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1.5 w-full resize-y rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-zinc-900"
                placeholder="주소와 우편번호"
              />
            </div>
            <div className="rounded-xl border border-dashed border-zinc-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">쿠폰</p>
              <div className="mt-2 flex gap-2">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-900"
                  placeholder="코드 입력"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="shrink-0 rounded-lg border border-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-900 hover:text-white"
                >
                  적용
                </button>
              </div>
              <p className="mt-2 text-xs text-zinc-400">데모 코드: {COUPON_HINTS}</p>
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              {formatPrice(total)}원 결제하기 (데모)
            </button>
          </form>
        </section>

        <aside className="lg:col-span-5">
          <div className="sticky top-28">
            <OrderSummary
              rows={rows}
              subtotal={totalPrice}
              shipping={shipping}
              discount={discount}
              total={total}
            />
          </div>
        </aside>
      </div>
    </div>
  )
}
