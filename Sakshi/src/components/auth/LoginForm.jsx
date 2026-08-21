import { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { loginUser } from '../../api/authApi.js'
import { getDashboardRouteForUser, setStoredUser } from '../../auth/authStorage.js'

export function LoginForm() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const emailId = useId()
  const passId = useId()

  async function handleSignIn() {
    setError('')
    setIsLoading(true)

    try {
      const response = await loginUser({ email, password })
      const authenticatedUser = setStoredUser(response.user)
      navigate(getDashboardRouteForUser(authenticatedUser), { replace: true })
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Unable to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        void handleSignIn()
      }}
    >

      <div>
        <label htmlFor={emailId} className="mb-2 block text-sm font-semibold text-slate-800">
          Email Address
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Mail className="h-4 w-4" />
          </span>
          <input
            id={emailId}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            placeholder="Enter your company email"
            className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3.5 text-sm font-medium text-slate-800 shadow-sm outline-none transition duration-300 placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
      </div>

      <div>
        <label htmlFor={passId} className="mb-2 block text-sm font-semibold text-slate-800">
          Password
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Lock className="h-4 w-4" />
          </span>
          <input
            id={passId}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3.5 pr-12 text-sm font-medium text-slate-800 shadow-sm outline-none transition duration-300 placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-500 transition duration-300 hover:bg-slate-100 hover:text-slate-700"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-600">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20"
          />
          Remember me
        </label>

        <a href="#" className="text-sm font-semibold text-primary transition duration-300 hover:text-blue-700">
          Forgot Password?
        </a>
      </div>

      {error ? (
        <p className="text-sm font-semibold text-red-600" aria-live="polite">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-2xl bg-gradient-to-r from-primary to-[#1D4ED8] px-4 py-3.5 text-sm font-semibold text-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(37,99,235,0.28)] focus:outline-none focus:ring-4 focus:ring-primary/25"
      >
        {isLoading ? 'Signing In...' : 'Sign In'}
      </button>


      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-slate-500">OR</span>
        </div>
      </div>

      <button
        type="button"
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition duration-300 hover:-translate-y-1 hover:bg-slate-50"
      >
        <span className="grid h-6 w-6 place-items-center">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.4 12 2.4 6.9 2.4 2.8 6.5 2.8 11.6S6.9 20.8 12 20.8c6.9 0 8.6-4.8 8.6-7.3 0-.5 0-.9-.1-1.3H12Z" />
            <path fill="#34A853" d="M3.9 7.5l3.2 2.3C8 8 9.8 6.8 12 6.8c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.4 12 2.4c-3.6 0-6.7 2-8.1 5.1Z" />
            <path fill="#FBBC05" d="M12 20.8c2.6 0 4.8-.9 6.4-2.5l-3-2.4c-.8.6-1.9 1-3.4 1-3.9 0-5.2-2.6-5.5-3.8l-3.2 2.4c1.4 3.2 4.6 5.3 8.7 5.3Z" />
            <path fill="#4285F4" d="M20.6 12.2H12v3.9h5.5c-.3 1.4-1.3 2.5-2.5 3.2l3 2.4c1.8-1.7 2.6-4.2 2.6-7.2 0-.5 0-.9-.1-1.3Z" />
          </svg>
        </span>
        Continue with Google
      </button>
    </form>
  )
}
