import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useWishlist } from '../hooks/useWishlist'
import { useAuth } from '../hooks/useAuth'
import { useChatbot } from '../hooks/useChatbot'

function IconCart({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M6 6h15l-1.5 9h-12z" />
      <path d="M6 6 5 3H2" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
  )
}

function IconUser({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconHeart({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  )
}

function IconSearch({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" />
    </svg>
  )
}

const navLink =
  'text-sm font-medium text-zinc-600 transition hover:text-zinc-900 hidden sm:inline-block'

export function Header() {
  const { totalCount } = useCart()
  const { count: wishCount } = useWishlist()
  const { isAuthenticated, user, logout } = useAuth()
  const { openPanel } = useChatbot()
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const onSearch = (e) => {
    e.preventDefault()
    const term = q.trim()
    navigate(term ? `/shop?q=${encodeURIComponent(term)}` : '/shop')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/90 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        <Link to="/" className="shrink-0 text-lg font-semibold tracking-[0.12em] text-zinc-900">
          STUDIO LINE
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/shop" className={navLink}>
            SHOP
          </NavLink>
          <NavLink to="/shop?category=outer" className={navLink}>
            OUTER
          </NavLink>
          <NavLink to="/shop?sort=newest" className={navLink}>
            NEW
          </NavLink>
          <button
            type="button"
            onClick={openPanel}
            className={`${navLink} border-none bg-transparent p-0`}
          >
            AI 스타일
          </button>
        </nav>

        <form
          onSubmit={onSearch}
          className="mx-auto flex min-w-0 max-w-md flex-1 items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 sm:px-4"
        >
          <IconSearch className="h-4 w-4 shrink-0 text-zinc-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            placeholder="브랜드 · 상품명 검색"
            className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
            aria-label="검색"
          />
          <button
            type="submit"
            className="hidden shrink-0 rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white sm:inline-block"
          >
            검색
          </button>
        </form>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={openPanel}
            className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100 md:hidden"
            aria-label="AI 스타일 추천"
            title="AI 스타일 추천"
          >
            <span className="text-[10px] font-bold tracking-tight text-amber-700">AI</span>
          </button>
          <Link
            to="/shop?saved=1"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100"
            title="찜한 상품"
            aria-label={`찜 ${wishCount}개`}
          >
            <IconHeart className="h-5 w-5" />
            {wishCount > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />
            )}
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to="/mypage"
                className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100 md:hidden"
                aria-label="마이페이지"
              >
                <IconUser className="h-5 w-5" />
              </Link>
              <div className="hidden items-center gap-2 md:flex">
                <Link
                  to="/mypage"
                  className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  {user?.name ?? 'MY'} 님
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800"
                  >
                    관리자
                  </Link>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  로그아웃
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="hidden items-center gap-2 md:flex">
                <Link
                  to="/login"
                  className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  로그인
                </Link>
                <Link
                  to="/signup"
                  className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800"
                >
                  회원가입
                </Link>
              </div>
              <Link
                to="/login"
                className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100 md:hidden"
                aria-label="로그인"
              >
                <IconUser className="h-5 w-5" />
              </Link>
            </>
          )}
          <Link
            to="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100"
            aria-label={`장바구니 ${totalCount}개`}
          >
            <IconCart className="h-5 w-5" />
            {totalCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-900 px-1 text-[10px] font-bold text-white">
                {totalCount > 99 ? '99+' : totalCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}
