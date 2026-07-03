import { NavLink, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useCallback, useEffect } from 'react'
import Logo from './Logo.jsx'
import { useToast } from './Toast.jsx'
import { useAuth } from '../hooks/useAuth.jsx'
import { Avatar } from './ui.jsx'
import { realAPI } from '../services/realAPI.js'

function initialsFor(name) {
  if (!name) return '?'
  const parts = String(name).trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const navItems = [
  { to: '/app/dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['admin'] },
  { to: '/app/employee', label: 'My Portal', icon: 'person', roles: ['employee'] },
  { to: '/app/marketplace', label: 'Shift Marketplace', icon: 'storefront', roles: ['employee', 'admin'] },
  { to: '/app/my-swaps', label: 'My Swap Requests', icon: 'swap_horiz', roles: ['employee'] },
  { to: '/app/swaps', label: 'Swap Review', icon: 'swap_horiz', roles: ['admin'] },
  { to: '/app/leaves', label: 'Absence Requests', icon: 'event_busy', roles: ['employee', 'admin'] },
  { to: '/app/availability', label: 'Availability', icon: 'event_available', roles: ['employee', 'admin'] },
  { to: '/app/attendance', label: 'Attendance', icon: 'schedule', roles: ['admin'] },
  { to: '/app/employees', label: 'Employees', icon: 'groups', roles: ['admin'] },
  { to: '/app/insights', label: 'AI Insights', icon: 'monitor_heart', roles: ['admin'] },
]

export default function Sidebar({
  user,
  activeRole,
  setActiveRole,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) {
  return (
    <>
      <aside className="hidden md:block fixed left-0 top-0 h-screen z-30">
        <SidebarContent
          user={user}
          activeRole={activeRole}
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <div className="md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 z-[55] bg-on-surface/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="fixed left-0 top-0 h-full z-[56]"
            >
              <SidebarContent
                user={user}
                activeRole={activeRole}
                collapsed={false}
                mobile
                onNavigate={onCloseMobile}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

function SidebarContent({ user, activeRole, collapsed, onToggleCollapse, mobile, onNavigate }) {
  const navigate = useNavigate()
  const toast = useToast()
  const { logout } = useAuth()
  const items = navItems.filter((n) => n.roles.includes(activeRole))
  const settingsPath = activeRole === 'admin' ? '/app/admin' : '/app/profile'
  const settingsLabel = activeRole === 'admin' ? 'Settings' : 'Profile'
  const settingsIcon = activeRole === 'admin' ? 'settings' : 'person'
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function fetchCount() {
      try {
        const notifs = await realAPI.getNotifications()
        if (!cancelled) setUnreadCount((notifs || []).filter(n => n.status !== 'read').length)
      } catch { /* ignore */ }
    }
    fetchCount()
    const id = setInterval(fetchCount, 60_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])
  const toggleTheme = useCallback(() => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('gs_theme', next ? 'dark' : 'light')
  }, [dark])

  const railWidth = collapsed ? 'w-[72px]' : mobile ? 'w-[280px]' : 'w-[240px]'

  return (
    <aside
      className={`h-full ${railWidth} bg-gradient-to-b from-surface to-surface-dim border-r border-outline-variant/40 flex flex-col p-3 md:p-4 md:rounded-r-2xl md:shadow-soft-lg transition-[width] duration-300 ease-out overflow-hidden`}
    >
      {!mobile && (
        <>
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand' : 'Collapse'}
            className="absolute top-4 -right-3 z-[60] w-6 h-6 rounded-full bg-surface border border-outline-variant/60 shadow-soft-sm flex items-center justify-center text-on-surface-variant hover:text-primary hover:scale-105 transition-all"
          >
            <span className="material-symbols-outlined text-[14px]">
              {collapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
          <NavLink
            to="/"
            title="GhostShift"
            className={`flex items-center justify-center mb-5 ${collapsed ? 'px-0' : 'px-sm'} group`}
          >
            <span className="transition-transform group-hover:scale-105 flex-shrink-0">
              <Logo size={collapsed ? 28 : 32} />
            </span>
            {!collapsed && (
              <span className="font-headline-md text-headline-md font-bold text-on-surface leading-none">
                GhostShift
              </span>
            )}
          </NavLink>
        </>
      )}

      {mobile && (
        <NavLink
          to="/"
          onClick={onNavigate}
          className="mb-4 flex items-center gap-sm px-sm group"
          title="GhostShift"
        >
          <motion.div whileHover={{ rotate: -8, scale: 1.05 }} className="shadow-soft-sm flex-shrink-0">
            <Logo size={36} />
          </motion.div>
          <div className="min-w-0">
            <h1 className="font-headline-md text-headline-md font-bold text-on-surface leading-none">
              GhostShift
            </h1>
          </div>
        </NavLink>
      )}

      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto scrollbar-thin overflow-x-hidden">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `relative flex items-center gap-sm rounded-xl transition-all duration-200 font-label-md text-label-md ${
                collapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-md py-sm'
              } ${
                isActive
                  ? 'bg-primary text-on-primary font-semibold shadow-soft-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`
            }
          >
            <span className={`material-symbols-outlined text-[20px] flex-shrink-0 ${collapsed ? '' : ''}`}>{item.icon}</span>
            {!collapsed && item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-outline-variant/30 flex flex-col gap-1">
        <NavLink
          to="/app/notifications"
          onClick={onNavigate}
          title={collapsed ? 'Notifications' : undefined}
          className={`relative flex items-center gap-sm rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all font-label-md text-label-md ${
            collapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-md py-sm'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          {!collapsed && 'Notifications'}
          {!collapsed && unreadCount > 0 && (
            <span className="ml-auto chip bg-error text-on-error px-1.5 py-0.5 text-[10px]">{unreadCount}</span>
          )}
          {collapsed && unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error" />}
        </NavLink>
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        title={dark ? 'Light mode' : 'Dark mode'}
        className={`flex items-center gap-sm rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all font-label-md text-label-md ${
          collapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-md py-sm'
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">{dark ? 'light_mode' : 'dark_mode'}</span>
        {!collapsed && (dark ? 'Light mode' : 'Dark mode')}
      </button>

      <NavLink
        to={settingsPath}
        onClick={onNavigate}
        title={collapsed ? settingsLabel : undefined}
        className={({ isActive }) =>
          `relative flex items-center gap-sm rounded-xl transition-all duration-200 font-label-md text-label-md ${
            collapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-md py-sm'
          } ${
            isActive
              ? 'bg-primary text-on-primary font-semibold shadow-soft-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`
        }
      >
        <span className="material-symbols-outlined text-[20px] flex-shrink-0">{settingsIcon}</span>
        {!collapsed && settingsLabel}
      </NavLink>

      <div className="mt-1 pt-3 border-t border-outline-variant/30">
        <div className={`flex items-center gap-sm ${collapsed ? 'justify-center' : 'px-sm'}`}>
          <NavLink
            to={settingsPath}
            onClick={onNavigate}
            title={settingsLabel}
            className="flex-shrink-0 rounded-full hover:ring-2 hover:ring-primary/30 transition-all"
          >
            <Avatar
              src={user.avatar}
              initials={initialsFor(user.name)}
              size="md"
              className={collapsed ? '' : 'flex-shrink-0'}
            />
          </NavLink>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <NavLink
                to={settingsPath}
                onClick={onNavigate}
                className="block font-label-md text-label-md text-on-surface truncate hover:text-primary transition-colors"
              >
                {user.name}
              </NavLink>
              <div className="font-label-sm text-label-sm text-on-surface-variant truncate">{user.title}</div>
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="mt-3 px-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                {activeRole}
              </span>
            </div>
            <button
              onClick={() => { logout(); toast.push('Signed out', { tone: 'info' }); navigate('/login') }}
              className="w-full flex items-center justify-center gap-sm rounded-xl border border-error/30 py-1.5 text-label-sm font-medium text-error hover:bg-error/5 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
