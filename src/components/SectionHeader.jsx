import { Link } from 'react-router-dom'

export function SectionHeader({ title, subtitle, to, linkLabel = '전체보기' }) {
  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 max-w-xl text-sm text-zinc-500">{subtitle}</p>
        )}
      </div>
      {to && (
        <Link
          to={to}
          className="text-sm font-medium text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  )
}
