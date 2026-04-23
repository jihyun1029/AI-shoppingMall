const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value) {
  return EMAIL_RE.test(value.trim())
}

export function validateLoginForm({ email, password }) {
  const errors = {}
  if (!email.trim()) errors.email = '이메일을 입력해 주세요.'
  else if (!isValidEmail(email)) errors.email = '이메일 형식이 올바르지 않습니다.'

  if (!password) errors.password = '비밀번호를 입력해 주세요.'
  else if (password.length < 8) errors.password = '비밀번호는 8자 이상이어야 합니다.'

  return errors
}

export function validateSignupForm({
  name,
  email,
  password,
  confirmPassword,
  agreed,
}) {
  const errors = {}
  if (!name.trim()) errors.name = '이름을 입력해 주세요.'

  if (!email.trim()) errors.email = '이메일을 입력해 주세요.'
  else if (!isValidEmail(email)) errors.email = '이메일 형식이 올바르지 않습니다.'

  if (!password) errors.password = '비밀번호를 입력해 주세요.'
  else if (password.length < 8) errors.password = '비밀번호는 8자 이상이어야 합니다.'

  if (!confirmPassword) errors.confirmPassword = '비밀번호 확인을 입력해 주세요.'
  else if (confirmPassword !== password) {
    errors.confirmPassword = '비밀번호가 일치하지 않습니다.'
  }

  if (!agreed) errors.agreed = '필수 약관에 동의해 주세요.'

  return errors
}
