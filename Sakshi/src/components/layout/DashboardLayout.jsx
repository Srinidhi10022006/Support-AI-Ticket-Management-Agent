import { useState } from 'react'
import { Sidebar } from './Sidebar.jsx'
import { TopNav } from './TopNav.jsx'

export default function DashboardLayout({ children, variant = 'user' }) {
  // Sidebar has its own UI collapse state; we also need to reflect its width in the parent layout
  // so Main always uses the remaining viewport width.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className={(variant === 'admin' ? 'admin-dashboard-shell' : 'dashboard-shell') + ' min-h-screen w-full flex flex-row overflow-hidden'}>
      <div className="flex-shrink-0">
        <Sidebar
          variant={variant}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      </div>

      <div className="flex-1 min-w-0 overflow-hidden">
        <div className={(variant === 'admin' ? 'admin-main-surface' : 'dashboard-main-surface') + ' h-screen overflow-auto'}>
          <TopNav variant={variant} />
          <main className="relative px-6 pb-10 pt-6">{children}</main>
        </div>
      </div>
    </div>
  )
}



