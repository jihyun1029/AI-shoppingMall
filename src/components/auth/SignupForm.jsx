import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { validateSignupForm } from '../../utils/validation'
import { AuthLayout } from './AuthLayout'
import { InputField } from './InputField'
import { PasswordField } from './PasswordField'

export function SignupForm() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: 'unisex',
    agreed: false,
  })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState('')

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = validateSignupForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const result = await signup(form)
    if (!result.ok) {
      setSubmitError(result.message)
      return
    }
    setSubmitError('')
    setSuccess('회원가입이 완료되었습니다. 로그인 후 주문을 진행해 주세요.')
    setTimeout(() => {
      navigate('/login', { replace: true })
    }, 900)
  }

  return (
    <AuthLayout
      title="회원가입"
      subtitle="기본 정보만 입력하면 바로 가입할 수 있어요."
      footer={
        <p className="text-center text-sm text-zinc-500">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="font-medium text-zinc-900 underline">
            로그인
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        {submitError ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}
        <InputField
          id="signup-name"
          label="이름"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="홍길동"
          autoComplete="name"
          error={errors.name}
        />
        <InputField
          id="signup-email"
          label="이메일"
          type="email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email}
        />
        <PasswordField
          id="signup-password"
          label="비밀번호"
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
          autoComplete="new-password"
          error={errors.password}
        />
        <PasswordField
          id="signup-password-confirm"
          label="비밀번호 확인"
          value={form.confirmPassword}
          onChange={(e) => update('confirmPassword', e.target.value)}
          autoComplete="new-password"
          error={errors.confirmPassword}
        />
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            성별 (선택)
          </label>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {[
              { key: 'male', label: '남성' },
              { key: 'female', label: '여성' },
              { key: 'unisex', label: '공용' },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => update('gender', opt.key)}
                className={[
                  'rounded-lg border px-2 py-2 text-sm',
                  form.gender === opt.key
                    ? 'border-zinc-900 bg-zinc-900 text-white'
                    : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50',
                ].join(' ')}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-zinc-200 px-3 py-2">
          <input
            type="checkbox"
            checked={form.agreed}
            onChange={(e) => update('agreed', e.target.checked)}
            className="mt-0.5 rounded border-zinc-300"
          />
          <span className="text-sm text-zinc-600">
            (필수) 서비스 이용약관 및 개인정보 처리방침에 동의합니다.
          </span>
        </label>
        {errors.agreed ? (
          <p className="mt-1 text-xs text-red-600">{errors.agreed}</p>
        ) : null}
        <button
          type="submit"
          className="w-full rounded-full bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          회원가입
        </button>
      </form>
    </AuthLayout>
  )
}
