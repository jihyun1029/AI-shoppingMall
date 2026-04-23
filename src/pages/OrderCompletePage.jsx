import { Link, Navigate, useLocation } from 'react-router-dom'
import { formatPrice } from '../utils/format'
import { ProductImage } from '../components/ProductImage'

export function OrderCompletePage() {
  const location = useLocation()
  const s = location.state

  if (
    !s ||
    typeof s.customerName !== 'string' ||
    !Array.isArray(s.items) ||
    s.items.length === 0
  ) {
    return <Navigate to="/" replace />
  }

  const {
    customerName,
    phone,
    address,
    subtotal,
    shipping,
    discount,
    total,
    coupon,
    items,
  } = s

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-zinc-200 text-2xl">
        ✓
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">주문이 완료되었습니다</h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-500">
        데모 주문이므로 실제 결제·배송은 이루어지지 않습니다.
      </p>

      <dl className="mt-10 space-y-3 rounded-2xl border border-zinc-200 bg-white p-6 text-left text-sm shadow-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">받는 분</dt>
          <dd className="font-medium text-zinc-900">{customerName}</dd>
        </div>
        {phone && (
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">연락처</dt>
            <dd className="font-medium text-zinc-900">{phone}</dd>
          </div>
        )}
        <div>
          <dt className="text-zinc-500">배송지</dt>
          <dd className="mt-1 font-medium whitespace-pre-wrap text-zinc-900">{address}</dd>
        </div>
        {coupon && (
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">적용 쿠폰</dt>
            <dd className="font-medium text-zinc-900">{coupon}</dd>
          </div>
        )}
      </dl>

      <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-left">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">주문 상품</h2>
        <ul className="mt-4 space-y-4">
          {items.map((it, i) => (
            <li key={i} className="flex gap-3">
              <ProductImage
                product={{ image: it.image, images: [it.image] }}
                src={it.image}
                alt=""
                className="h-16 w-14 shrink-0 rounded-md object-cover ring-1 ring-zinc-100"
              />
              <div className="min-w-0 flex-1 text-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  {it.brand}
                </p>
                <p className="font-medium text-zinc-900">{it.name}</p>
                <p className="text-xs text-zinc-500">
                  {it.color} / {it.size} · {it.qty}개
                </p>
                <p className="mt-1 text-sm font-semibold tabular-nums">
                  {formatPrice(it.price * it.qty)}원
                </p>
              </div>
            </li>
          ))}
        </ul>
        <dl className="mt-6 space-y-2 border-t border-zinc-200 pt-4 text-sm">
          <div className="flex justify-between text-zinc-600">
            <dt>상품 합계</dt>
            <dd className="tabular-nums">{formatPrice(subtotal)}원</dd>
          </div>
          <div className="flex justify-between text-zinc-600">
            <dt>배송비</dt>
            <dd className="tabular-nums">
              {shipping === 0 ? '무료' : `${formatPrice(shipping)}원`}
            </dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-rose-600">
              <dt>할인</dt>
              <dd className="tabular-nums">-{formatPrice(discount)}원</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-zinc-200 pt-3 text-base font-semibold text-zinc-900">
            <dt>최종 결제</dt>
            <dd className="tabular-nums">{formatPrice(total)}원</dd>
          </div>
        </dl>
      </div>

      <Link
        to="/shop"
        className="mt-10 inline-flex rounded-full border border-zinc-900 px-8 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-900 hover:text-white"
      >
        계속 쇼핑하기
      </Link>
    </div>
  )
}
