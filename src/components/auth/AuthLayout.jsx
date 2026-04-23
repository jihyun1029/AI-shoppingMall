import { Link } from 'react-router-dom'

export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm sm:p-8">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
          STUDIO LINE MEMBERS
        </p>
        <h1 className="mt-2 text-center text-2xl font-semibold tracking-tight text-zinc-900">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-center text-sm leading-relaxed text-zinc-500">
            {subtitle}
          </p>
        )}
        <div className="mt-7">{children}</div>
        {footer && <div className="mt-6">{footer}</div>}
        <Link
          to="/"
          className="mt-6 block text-center text-xs font-medium text-zinc-500 hover:text-zinc-900"
        >
          ← 홈으로
        </Link>
      </div>
    </div>
  )
}
