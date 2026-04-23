import { useState } from 'react'
import { InputField } from './InputField'

export function PasswordField({ id, label, error, helper, ...props }) {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900"
        >
          {visible ? '숨기기' : '보기'}
        </button>
      </div>
      <InputField
        id={id}
        aria-label={label}
        type={visible ? 'text' : 'password'}
        error={error}
        helper={helper}
        {...props}
      />
    </div>
  )
}
