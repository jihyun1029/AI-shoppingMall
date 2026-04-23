import { Link } from 'react-router-dom'
import { SHOP_CATEGORIES } from '../data/products'

export function CategoryMenu({ variant = 'default' }) {
  const base =
    variant === 'compact'
      ? 'flex gap-2 overflow-x-auto pb-1 scrollbar-thin'
      : 'flex flex-wrap gap-2'

  return (
    <nav aria-label="카테고리" className={base}>
      <Link
        to="/shop"
        className="shrink-0 rounded-full border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm text-white transition hover:bg-zinc-800"
      >
        전체
      </Link>
      {SHOP_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
        <Link
          key={c.id}
          to={c.id === 'all' ? '/shop' : `/shop?category=${c.id}`}
          className="shrink-0 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-800 transition hover:border-zinc-900 hover:bg-zinc-900 hover:text-white"
        >
          {c.label}
        </Link>
      ))}
    </nav>
  )
}
