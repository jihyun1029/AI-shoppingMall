import { formatPrice } from '../utils/format'
import { FREE_SHIPPING_THRESHOLD } from '../utils/shipping'

export function OrderSummary({ rows, subtotal, shipping, discount = 0, total, footer }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">주문 요약</h2>
      <ul className="mt-4 max-h-56 space-y-3 overflow-y-auto text-sm">
        {rows.map((r, i) => (
          <li key={i} className="flex justify-between gap-3 text-zinc-700">
            <span className="min-w-0">
              <span className="font-medium text-zinc-900">{r.title}</span>
              {r.sub && <span className="block text-xs text-zinc-500">{r.sub}</span>}
              <span className="text-xs text-zinc-400"> ×{r.qty}</span>
            </span>
            <span className="shrink-0 tabular-nums text-zinc-900">
              {formatPrice(r.linePrice)}원
            </span>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-2 border-t border-zinc-100 pt-4 text-sm">
        <div className="flex justify-between text-zinc-600">
          <dt>상품 합계</dt>
          <dd className="tabular-nums text-zinc-900">{formatPrice(subtotal)}원</dd>
        </div>
        <div className="flex justify-between text-zinc-600">
          <dt>배송비</dt>
          <dd className="tabular-nums text-zinc-900">
            {shipping === 0 ? '무료' : `${formatPrice(shipping)}원`}
          </dd>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-rose-600">
            <dt>쿠폰 할인</dt>
            <dd className="tabular-nums">-{formatPrice(discount)}원</dd>
          </div>
        )}
        <div className="flex justify-between border-t border-zinc-100 pt-3 text-base font-semibold text-zinc-900">
          <dt>결제 예정</dt>
          <dd className="tabular-nums">{formatPrice(total)}원</dd>
        </div>
      </dl>
      {subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD && (
        <p className="mt-3 text-xs text-zinc-500">
          {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)}원 더 담으면 배송비 무료 (데모 기준)
        </p>
      )}
      {footer && <div className="mt-5">{footer}</div>}
    </div>
  )
}
