import { Navigate } from 'react-router-dom'
import { SignupForm } from '../components/auth/SignupForm'
import { useAuth } from '../hooks/useAuth'

export function SignupPage() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/" replace />
  return <SignupForm />
}
