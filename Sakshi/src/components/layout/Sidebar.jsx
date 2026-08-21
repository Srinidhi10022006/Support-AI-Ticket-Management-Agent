import { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Ticket,
  BarChart3,
  Sparkles,
  ChevronLeft,
  LogOut,
  User,
} from 'lucide-react'
import { logoutUser } from '../../auth/authStorage.js'
import { getStoredUser } from '../../auth/authStorage.js'

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'raise', label: 'Raise Ticket', icon: Ticket },
  { key: 'my', label: 'My Tickets', icon: Ticket },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
  { key: 'logout', label: 'Logout', icon: LogOut, action: 'logout' },
]

export function Sidebar({ collapsed: collapsedProp, onCollapsedChange, variant = 'user' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const collapsed = collapsedProp ?? internalCollapsed
  const setCollapsed = onCollapsedChange ?? setInternalCollapsed
  const isAdmin = variant === 'admin'
  const user = getStoredUser()
  const displayName = user?.fullName || user?.email || ''
  const roleLabel = user?.role === 'ADMIN' ? 'Enterprise Admin' : 'Enterprise User'

  const adminOverviewItem = { key: 'overview', label: 'Overview', icon: BarChart3 }
  const filteredNavItems = isAdmin
    ? [adminOverviewItem, ...navItems.filter((item) => item.key !== 'raise')]
    : navItems
  const IconMap = useMemo(() => filteredNavItems, [isAdmin])

  const widthClass = collapsed ? 'w-[80px]' : 'w-[280px]'

  const getNavigationRoute = (itemKey) => {
    if (isAdmin) {
      switch (itemKey) {
        case 'overview':
          return '/admin#overview'
        case 'dashboard':
          return '/admin'
        case 'my':
          return '/admin/tickets'
        case 'reports':
          return '/reports'
        default:
          return '#'
      }
    } else {
      switch (itemKey) {
        case 'dashboard':
          return '/dashboard'
        case 'raise':
          return '/raise-ticket'
        case 'my':
          return '/my-tickets'
        default:
          return '#'
      }
    }
  }

  const isItemActive = (itemKey) => {
    if (itemKey === 'logout') return false
    const route = getNavigationRoute(itemKey)
    if (route.includes('#')) {
      const [path, hash] = route.split('#')
      return location.pathname === path && location.hash === '#' + hash
    }
    return location.pathname === route || location.pathname.startsWith(route + '/')
  }

  const handleNavigation = (event, itemKey) => {
    event.preventDefault()
    const route = getNavigationRoute(itemKey)
    if (route !== '#') {
      navigate(route)
    }
  }

  const handleLogout = (event) => {
    event.preventDefault()

    if (!window.confirm('Are you sure you want to logout?')) return

    logoutUser()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      className={
        'h-screen transition-all duration-300 ease-in-out ' +
        widthClass +
        ' z-20'
      }
    >
      <div className={(isAdmin ? 'admin-sidebar-surface' : 'sidebar-surface') + ' h-full backdrop-blur shadow-soft'}>
        <div className="h-full flex flex-col p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={(isAdmin ? 'bg-[#0F766E] shadow-[0_10px_30px_rgba(15,118,110,0.25)]' : 'bg-gradient-to-br from-[#007CC3] to-[#6D5DF6] shadow-[0_10px_30px_rgba(109,93,246,0.25)]') + ' h-9 w-9 rounded-2xl'} />
              {!collapsed && (
                <div>
                  <p className={(isAdmin ? 'text-white' : 'text-[#0B1F4D]') + ' font-extrabold leading-tight'}>Infosys</p>
                  <p className={isAdmin ? 'text-xs text-slate-300' : 'text-xs text-slate-600'}>Support AI</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setCollapsed((s) => !s)}
              className={(isAdmin ? 'hover:bg-white/10' : 'hover:bg-slate-100/60') + ' rounded-xl p-2 transition'}
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className={isAdmin ? 'h-5 w-5 text-slate-200' : 'h-5 w-5 text-slate-700'} />
            </button>
          </div>


          {/* Menu takes remaining space */}
          <nav className="flex-1 mt-4 overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-auto pr-1">
                <div
                  className={
                    collapsed
                      ? 'space-y-[18px]'
                      : 'space-y-[18px]'
                  }
                >
                  {IconMap.map((item) => {
                    const Icon = item.icon
                    const isLogoutItem = item.action === 'logout'
                    const isActive = isItemActive(item.key)
                    return (
                      <a
                        key={item.key}
                        href="#"
                        onClick={(e) => isLogoutItem ? handleLogout(e) : handleNavigation(e, item.key)}
                        className={
                          isAdmin
                            ? `group flex items-center gap-3 rounded-2xl px-3 py-2.5 border transition hover:border-[#0F766E]/70 hover:bg-[#0F766E]/20 focus:bg-[#0F766E]/25 ${isActive ? 'border-[#0F766E]/70 bg-[#0F766E]/25 shadow-[inset_3px_0_0_#14B8A6]' : 'border-transparent'}`
                            : `group flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-white/70 transition border ${isActive ? 'border-[#BFDBFE] bg-white/50' : 'border-transparent'}`
                        }
                      >
                        <div className={(isAdmin ? `${isActive ? 'bg-[#0F766E] border-[#14B8A6]' : 'bg-slate-700/80 border-slate-600'} group-hover:bg-[#0F766E] group-hover:border-[#14B8A6]` : 'bg-gradient-to-br from-[#007CC3]/15 to-[#6D5DF6]/15 border-white/50') + ' h-8 w-8 rounded-2xl border flex items-center justify-center'}>
                          <Icon className={(isAdmin ? 'text-slate-100' : 'text-[#0B1F4D]') + ' h-4 w-4 group-hover:scale-105 transition'} />
                        </div>
                        {!collapsed && (
                          <span className={isAdmin ? 'font-semibold text-slate-100' : 'font-semibold text-slate-800'}>{item.label}</span>
                        )}
                      </a>
                    )
                  })}
                </div>
              </div>
            </div>
          </nav>

          {/* Pinned profile: no absolute positioning */}
          <div className="mt-auto">
            <div className={isAdmin ? 'rounded-3xl border border-slate-700 bg-slate-800/70 p-4 shadow-soft' : 'dashboard-panel rounded-3xl p-4 shadow-soft'}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={(isAdmin ? 'bg-[#0F766E]/20 border-[#0F766E]/40' : 'bg-gradient-to-br from-[#007CC3]/20 to-[#6D5DF6]/20 border-white/60') + ' h-9 w-9 rounded-2xl border flex items-center justify-center'}>
                    <User className={isAdmin ? 'h-4 w-4 text-teal-100' : 'h-4 w-4 text-[#0B1F4D]'} />
                  </div>
                  {!collapsed && (
                    <div>
                      <p className={isAdmin ? 'font-bold text-white' : 'font-bold text-[#0B1F4D]'}>{displayName}</p>
                      <p className={isAdmin ? 'text-xs text-slate-300' : 'text-xs text-slate-600'}>{roleLabel}</p>
                    </div>
                  )}
                </div>

                {!collapsed ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-[#22C55E] shadow-[0_0_0_6px_rgba(34,197,94,0.15)]" />
                    <span className={isAdmin ? 'text-xs font-semibold text-slate-200' : 'text-xs font-semibold text-slate-700'}>Online</span>
                  </div>
                ) : (
                  <div className={isAdmin ? 'inline-flex h-8 w-8 items-center justify-center rounded-2xl border border-[#0F766E]/40 bg-[#0F766E]/15' : 'dashboard-chip inline-flex h-8 w-8 items-center justify-center rounded-2xl'}>
                    <Sparkles className={isAdmin ? 'h-4 w-4 text-teal-200' : 'h-4 w-4 text-[#007CC3]'} />
                  </div>
                )}
              </div>

              {!collapsed && (
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex flex-col">
                    <p className={isAdmin ? 'text-xs text-slate-300' : 'text-xs text-slate-600'}>Support AI Status</p>
                    <p className={isAdmin ? 'text-sm font-extrabold text-white' : 'text-sm font-extrabold text-[#0B1F4D]'}>AI Assistant online</p>
                  </div>
                  <div className={(isAdmin ? 'bg-[#0F766E]/20' : 'bg-gradient-to-br from-[#007CC3]/20 to-[#6D5DF6]/20') + ' h-10 w-10 rounded-2xl flex items-center justify-center'}>
                    <span className="h-2 w-2 rounded-full bg-[#22C55E] shadow-[0_0_0_6px_rgba(34,197,94,0.18)]" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}


