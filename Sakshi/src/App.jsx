import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { Login } from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import RaiseTicket from './pages/RaiseTicket.jsx'
import AdminDashboardPage from './pages/Admin.jsx'
import Logout from './pages/Logout.jsx'

import { RequireRole } from './auth/RequireAuth.jsx'
import { getDashboardRouteForUser, getStoredUser } from './auth/authStorage.js'

function getModeRouteTarget(user) {
  if (!user) return '/login'
  return getDashboardRouteForUser(user)
}

function RoleBasedRedirect() {
  const user = getStoredUser()
  const target = getModeRouteTarget(user)
  return <Navigate to={target} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />

        <Route
          path="/admin"
          element={
            <RequireRole role="ADMIN">
              <AdminDashboardPage />
            </RequireRole>
          }
        />

        <Route
          path="/dashboard"
          element={
            <RequireRole role="USER">
              <Home />
            </RequireRole>
          }
        />

        <Route
          path="/raise-ticket"
          element={
            <RequireRole role="USER">
              <RaiseTicket />
            </RequireRole>
          }
        />

        {/* Back-compat routes (do not change UI; map to protected pages) */}
        <Route path="/home" element={<RequireRole role="USER"><Home /></RequireRole>} />

        <Route path="*" element={<RoleBasedRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}

