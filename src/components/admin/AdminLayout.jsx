import { Link, NavLink, Outlet } from 'react-router-dom'

function navClass({ isActive }) {
  return [
    'block rounded-lg px-3 py-2 text-sm font-medium transition',
    isActive ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100',
  ].join(' ')
}

export function AdminLayout() {
  return (
    <div className="mx-auto flex w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:py-10">
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-24 space-y-3 rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Admin</p>
          <nav className="space-y-1">
            <NavLink to="/admin" end className={navClass}>
              대시보드
            </NavLink>
            <NavLink to="/admin/products" className={navClass}>
              상품 관리
            </NavLink>
            <NavLink to="/admin/orders" className={navClass}>
              주문 관리
            </NavLink>
            <NavLink to="/admin/users" className={navClass}>
              회원 관리
            </NavLink>
          </nav>
          <Link
            to="/"
            className="mt-2 block rounded-lg border border-zinc-200 px-3 py-2 text-center text-xs font-medium text-zinc-500 hover:bg-zinc-50"
          >
            사용자 화면으로
          </Link>
        </div>
      </aside>

      <main className="min-w-0 flex-1 space-y-4">
        <nav className="flex flex-wrap gap-2 rounded-2xl border border-zinc-200 bg-white p-2 lg:hidden">
          <NavLink to="/admin" end className={navClass}>
            대시보드
          </NavLink>
          <NavLink to="/admin/products" className={navClass}>
            상품 관리
          </NavLink>
          <NavLink to="/admin/orders" className={navClass}>
            주문 관리
          </NavLink>
          <NavLink to="/admin/users" className={navClass}>
            회원 관리
          </NavLink>
        </nav>
        <Outlet />
      </main>
    </div>
  )
}
