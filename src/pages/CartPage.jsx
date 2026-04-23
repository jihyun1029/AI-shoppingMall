import { Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { CartItem } from '../components/CartItem'
import { OrderSummary } from '../components/OrderSummary'
import { CartRecommendationSection } from '../components/recommendation/CartRecommendationSection.jsx'
import { getShippingFee } from '../utils/shipping'

export function CartPage() {
  const { items, totalPrice } = useCart()
  const shipping = getShippingFee(totalPrice)
  const total = totalPrice + shipping

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-semibold text-zinc-900">장바구니가 비어 있습니다</h1>
        <p className="mt-2 text-sm text-zinc-500">
          마음에 드는 피스를 담아보세요. 옵션은 장바구니에 그대로 저장됩니다.
        </p>
        <Link
          to="/shop"
          className="mt-8 inline-flex rounded-full bg-zinc-900 px-8 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          쇼핑 계속하기
        </Link>
      </div>
    )
  }

  const rows = items.map((line) => ({
    title: line.product.name,
    sub: `${line.product.brand} · ${line.colorLabel} / ${line.size}`,
    qty: line.quantity,
    linePrice: line.product.price * line.quantity,
  }))

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">장바구니</h1>
      <p className="mt-1 text-sm text-zinc-500">옵션과 수량을 확인한 뒤 주문을 진행해 주세요.</p>

      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ul className="divide-y divide-zinc-100 border-t border-zinc-100">
            {items.map((line) => (
              <CartItem key={line.key} line={line} />
            ))}
          </ul>
        </div>
        <div className="lg:col-span-5">
          <div className="sticky top-28">
            <OrderSummary
              rows={rows}
              subtotal={totalPrice}
              shipping={shipping}
              discount={0}
              total={total}
              footer={
                <Link
                  to="/checkout"
                  className="flex w-full items-center justify-center rounded-full bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  주문하기
                </Link>
              }
            />
          </div>
        </div>
      </div>

      <CartRecommendationSection />
    </div>
  )
}
