import { Headset } from 'lucide-react'
import { LoginForm } from './LoginForm.jsx'

export function RightPanel() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-enterprise-grid opacity-50" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.10),transparent_35%)]" />

      <div className="relative w-full max-w-[470px] rounded-[20px] bg-white/90 p-8 shadow-panel ring-1 ring-slate-200/70 backdrop-blur-sm animate-fadeIn sm:p-10">
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-b from-blue-600/12 to-blue-600/5 ring-1 ring-blue-600/15">
            <Headset className="h-11 w-11 text-blue-700" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome Back</h2>
          <p className="mt-2 text-base text-slate-500">Sign in to continue to your account.</p>
        </div>

        <div className="mt-8">
          <LoginForm />
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          &copy; 2026 Support AI Ticket Management Agent
        </div>
      </div>
    </section>
  )
}
