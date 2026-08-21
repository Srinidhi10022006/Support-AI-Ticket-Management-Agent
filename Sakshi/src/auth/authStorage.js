const STORAGE_KEY = 'auth.user'
const AUTH_STORAGE_KEYS = [
  'storedUser',
  'user',
  'token',
  'authToken',
  'accessToken',
  'refreshToken',
  'role',
]

function normalizeUser(user) {
  const role = String(user?.role ?? '').trim().toUpperCase()
  if (!role) return null
  if (role !== 'ADMIN' && role !== 'USER') return null

  return {
    userId: user.userId,
    employeeId: user.employeeId,
    fullName: user.fullName,
    email: user.email,
    role,
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    return normalizeUser(parsed)
  } catch {
    return null
  }
}

export function getStoredAuthUser() {
  return getStoredUser()
}

export function setStoredUser(user) {
  const normalizedUser = normalizeUser(user)
  if (!normalizedUser) {
    logoutUser()
    return null
  }

  AUTH_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedUser))
  return normalizedUser
}

export function getDashboardRouteForUser(user) {
  const normalizedUser = normalizeUser(user)
  if (!normalizedUser) return '/login'
  return normalizedUser.role === 'ADMIN' ? '/admin' : '/dashboard'
}

export function logoutUser() {
  localStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem(STORAGE_KEY)
  AUTH_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  })
}
