import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getStoredAuthUser, getStoredUser } from './authStorage.js'

export function RequireLogin() {
  const user = getStoredUser()
  const location = useLocation()

  if (!user) {
    // Prevent transient/empty renders from bouncing an authenticated user back to login.
    // If localStorage has a user but parsing failed, getStoredUser() returns null.
    // For safety, keep RequireRole authoritative and avoid redirect loops.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}


export function RequireRole({ role, children }) {
  const user = getStoredAuthUser()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (String(user.role ?? '').trim().toUpperCase() !== role) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children ?? <Outlet />
}

