import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { validateLoginForm } from '../../utils/validation'
import { InputField } from './InputField'
import { PasswordField } from './PasswordField'
import { AuthLayout } from './AuthLayout'

export function LoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [authError, setAuthError] = useState('')

  const from = location.state?.from
  const redirectTo = from
    ? `${from.pathname || '/'}${from.search || ''}${from.hash || ''}`
    : '/'

  const onSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = validateLoginForm({ email, password })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const result = await login(email, password)
    if (!result.ok) {
      setAuthError(result.message)
      return
    }
    navigate(redirectTo, { replace: true })
  }

  return (
    <AuthLayout
      title="로그인"
      subtitle="주문과 마이페이지를 이용하려면 로그인해 주세요. 관리자 계정: admin@studio-line.com / admin1234"
      footer={
        <p className="text-center text-sm text-zinc-500">
          아직 회원이 아니신가요?{' '}
          <Link to="/signup" className="font-medium text-zinc-900 underline">
            회원가입
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        {authError ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {authError}
          </p>
        ) : null}
        <InputField
          id="login-email"
          label="이메일"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email}
        />
        <PasswordField
          id="login-password"
          label="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="8자 이상 입력"
          autoComplete="current-password"
          error={errors.password}
        />
        <button
          type="submit"
          className="w-full rounded-full bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          로그인
        </button>
        <div className="flex justify-center gap-3 text-xs text-zinc-500">
          <span className="cursor-default">아이디 찾기</span>
          <span>·</span>
          <span className="cursor-default">비밀번호 찾기</span>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1">
          {['KAKAO', 'NAVER', 'GOOGLE'].map((p) => (
            <button
              key={p}
              type="button"
              className="rounded-lg border border-zinc-200 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
            >
              {p}
            </button>
          ))}
        </div>
      </form>
    </AuthLayout>
  )
}
