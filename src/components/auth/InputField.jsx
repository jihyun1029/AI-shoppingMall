export function InputField({
  id,
  label,
  error,
  helper,
  className = '',
  ...props
}) {
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {label}
        </label>
      ) : null}
      <input
        id={id}
        {...props}
        className={[
          `${label ? 'mt-1.5' : ''} w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition`,
          error
            ? 'border-red-300 bg-red-50/30 focus:border-red-400'
            : 'border-zinc-200 focus:border-zinc-900',
        ].join(' ')}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      ) : helper ? (
        <p className="mt-1.5 text-xs text-zinc-400">{helper}</p>
      ) : null}
    </div>
  )
}
