import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Footer() {
  const { isAuthenticated, logout, user } = useAuth()

  return (
    <footer className="border-t border-zinc-200 bg-zinc-950 text-zinc-400">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
            STUDIO LINE
          </p>
          <p className="mt-3 text-sm leading-relaxed">
            포트폴리오용 패션 이커머스 데모입니다. 브랜드명과 상품은 가상으로 구성되었습니다.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">쇼핑</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/shop" className="hover:text-white">
                전체 상품
              </Link>
            </li>
            <li>
              <Link to="/shop?category=outer" className="hover:text-white">
                아우터
              </Link>
            </li>
            <li>
              <Link to="/shop?category=top" className="hover:text-white">
                상의
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">고객</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <span className="cursor-default">배송 안내 (데모)</span>
            </li>
            <li>
              <span className="cursor-default">교환/반품 (데모)</span>
            </li>
            <li>
              {isAuthenticated ? (
                <button type="button" onClick={logout} className="hover:text-white">
                  로그아웃
                </button>
              ) : (
                <Link to="/login" className="hover:text-white">
                  로그인
                </Link>
              )}
            </li>
            {!isAuthenticated && (
              <li>
                <Link to="/signup" className="hover:text-white">
                  회원가입
                </Link>
              </li>
            )}
            {user?.role === 'admin' && (
              <li>
                <Link to="/admin" className="hover:text-white">
                  관리자
                </Link>
              </li>
            )}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">뉴스레터</p>
          <p className="mt-3 text-sm">데모에서는 구독 기능이 없습니다.</p>
        </div>
      </div>
      <div className="border-t border-zinc-800 py-6 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} STUDIO LINE · Portfolio demo
      </div>
    </footer>
  )
}
