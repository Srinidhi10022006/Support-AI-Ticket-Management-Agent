import { Bell, Search, Sparkles, User } from 'lucide-react'
import { getStoredUser } from '../../auth/authStorage.js'

export function TopNav({ variant = 'user' }) {
  const isAdmin = variant === 'admin'
  const user = getStoredUser()
  const displayName = user?.fullName || user?.email || ''

  return (
    <header className="sticky top-0 z-10 px-6 py-2">
      <div className={(isAdmin ? 'rounded-3xl border border-slate-200 bg-white px-5 py-2 shadow-[0_10px_30px_rgba(15,23,42,0.06)]' : 'dashboard-panel rounded-3xl px-5 py-2') + ' flex items-center justify-between gap-4'}>

        <div className="flex items-center gap-4">
          <div className={(isAdmin ? 'hidden md:flex h-10 w-10 rounded-2xl border border-teal-100 bg-teal-50 items-center justify-center' : 'hidden md:flex h-10 w-10 rounded-2xl bg-gradient-to-br from-[#007CC3]/20 to-[#6D5DF6]/20 border border-white/50 items-center justify-center')}>
            <span className="text-xl">⚡</span>
          </div>

          <div className={(isAdmin ? 'hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5' : 'dashboard-chip hidden sm:flex items-center gap-2 rounded-full px-4 py-2.5')}>
            <Search className="h-4 w-4 text-slate-600" />

            <input
              className="bg-transparent outline-none w-64 text-sm font-semibold text-slate-800 placeholder:text-slate-500"
              placeholder="Search tickets, categories, solutions..."
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className={(isAdmin ? 'h-10 w-10 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50' : 'dashboard-chip h-10 w-10 rounded-2xl hover:bg-white/90') + ' transition flex items-center justify-center'}>
            <Bell className="h-4 w-4 text-slate-700" />
          </button>

          <button className={(isAdmin ? 'h-10 w-10 rounded-2xl border border-teal-100 bg-teal-50 hover:bg-teal-100' : 'h-10 w-10 rounded-2xl border border-white/60 bg-gradient-to-br from-[#007CC3]/20 to-[#6D5DF6]/20 hover:from-[#007CC3]/30 hover:to-[#6D5DF6]/30') + ' transition flex items-center justify-center'}>
            <Sparkles className={isAdmin ? 'h-4 w-4 text-[#0F766E]' : 'h-4 w-4 text-[#007CC3]'} />
          </button>

          <div className={(isAdmin ? 'h-10 rounded-2xl border border-slate-200 bg-white px-3' : 'dashboard-chip h-10 rounded-2xl px-3') + ' flex items-center gap-2'}>
            <div className={(isAdmin ? 'bg-[#0F766E]' : 'bg-gradient-to-br from-[#007CC3] to-[#6D5DF6]') + ' h-7 w-7 rounded-xl flex items-center justify-center'}>
              <User className="h-4 w-4 text-white" />
            </div>
            <span className="hidden md:inline text-sm font-bold text-[#0B1F4D]">{displayName}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
