import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'
import { useWishlist } from '../hooks/useWishlist'
import { GENDER_OPTIONS } from '../data/products.js'
import { formatPrice } from '../utils/format'

function genderLabel(value) {
  if (!value || value === 'unknown') return '선택 안 함'
  return GENDER_OPTIONS.find((g) => g.value === value)?.label ?? value
}

function QuickCard({ to, title, description, meta, accent = false }) {
  const inner = (
    <>
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500">{description}</p>
      {meta != null && meta !== '' && (
        <p
          className={`mt-3 text-2xl font-semibold tabular-nums tracking-tight ${
            accent ? 'text-amber-700' : 'text-zinc-900'
          }`}
        >
          {meta}
        </p>
      )}
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-900 hover:shadow-md"
      >
        {inner}
        <span className="mt-3 inline-flex text-xs font-medium text-zinc-500 group-hover:text-zinc-900">
          이동 →
        </span>
      </Link>
    )
  }

  return (
    <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/60 p-5">
      {inner}
      <p className="mt-3 text-xs text-zinc-400">데모에서는 연결되지 않았습니다.</p>
    </div>
  )
}

export function MyPage() {
  const { user, logout } = useAuth()
  const { totalCount, items, totalPrice } = useCart()
  const { count: wishCount } = useWishlist()

  const initial = (user?.name || user?.email || '?').slice(0, 1).toUpperCase()
  const lineKinds = items.length
  const canCheckout = items.length > 0

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="flex flex-col gap-6 border-b border-zinc-100 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">My account</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            마이페이지
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-500">
            회원 정보와 쇼핑 활동을 한곳에서 확인하세요.
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="self-start rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 sm:self-auto"
        >
          로그아웃
        </button>
      </div>

      <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center">
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-2xl font-semibold text-white"
          aria-hidden
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-zinc-900">{user?.name ?? '회원'}</h2>
            {user?.role === 'admin' && (
              <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                Admin
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-sm text-zinc-500">{user?.email}</p>
        </div>
      </div>

      <section className="mt-10" aria-labelledby="mypage-summary">
        <h2 id="mypage-summary" className="sr-only">
          쇼핑 요약
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <QuickCard
            to="/cart"
            title="장바구니"
            description="담아 둔 상품과 옵션을 확인합니다."
            meta={`${totalCount}개 · ${lineKinds}종`}
          />
          <QuickCard
            to="/shop?saved=1"
            title="찜한 상품"
            description="저장해 둔 상품만 모아봅니다."
            meta={`${wishCount}개`}
            accent
          />
          <QuickCard
            title="주문 내역"
            description="결제·배송 상태를 확인합니다."
            meta={null}
          />
        </div>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-12">
        <section className="lg:col-span-7" aria-labelledby="mypage-account">
          <h2 id="mypage-account" className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            계정 정보
          </h2>
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <dl className="divide-y divide-zinc-100 text-sm">
              <div className="flex justify-between gap-6 py-3 first:pt-0">
                <dt className="shrink-0 text-zinc-500">이름</dt>
                <dd className="text-right font-medium text-zinc-900">{user?.name ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-6 py-3">
                <dt className="shrink-0 text-zinc-500">이메일</dt>
                <dd className="break-all text-right font-medium text-zinc-900">{user?.email ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-6 py-3 last:pb-0">
                <dt className="shrink-0 text-zinc-500">성별</dt>
                <dd className="text-right font-medium text-zinc-900">{genderLabel(user?.gender)}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="lg:col-span-5" aria-labelledby="mypage-actions">
          <h2 id="mypage-actions" className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            바로가기
          </h2>
          <div className="mt-4 space-y-3">
            {canCheckout ? (
              <Link
                to="/checkout"
                className="flex w-full items-center justify-between rounded-2xl bg-zinc-900 px-5 py-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                <span>주문하기</span>
                <span className="tabular-nums opacity-90">{formatPrice(totalPrice)}원</span>
              </Link>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-5 py-4 text-sm text-zinc-500">
                장바구니가 비어 있어 주문을 진행할 수 없습니다.
              </div>
            )}
            <Link
              to="/shop"
              className="flex w-full items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3.5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-900 hover:bg-zinc-50"
            >
              쇼핑 계속하기
            </Link>
            <Link
              to="/shop?sort=newest"
              className="flex w-full items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-900 hover:bg-zinc-50"
            >
              신상품 보러가기
            </Link>
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="flex w-full items-center justify-center rounded-2xl border border-zinc-900 bg-white px-5 py-3.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-900 hover:text-white"
              >
                관리자 대시보드
              </Link>
            )}
          </div>

          <div className="mt-8 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-5 text-xs leading-relaxed text-zinc-500">
            <p className="font-medium text-zinc-700">안내</p>
            <p className="mt-2">
              비밀번호 변경·탈퇴 등은 데모 범위에 포함되어 있지 않습니다. 문의는 포트폴리오 설명을 참고해
              주세요.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
