import { useState, useRef, useEffect, useContext, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ROLES } from '../data/roles.js'
import { useToast } from './Toast.jsx'
import { MobileNavContext } from '../layout/AppShell.jsx'
import { Avatar } from './ui.jsx'
import { realAPI } from '../services/realAPI.js'

// Map server notification type → icon + bg
const NOTIF_STYLE = {
  auto_assigned: { icon: 'auto_awesome', iconBg: 'bg-success/15 text-success' },
  shift_assigned: { icon: 'event_available', iconBg: 'bg-primary/10 text-primary' },
  shift_approved: { icon: 'check_circle', iconBg: 'bg-success/10 text-success' },
  shift_rejected: { icon: 'cancel', iconBg: 'bg-error/10 text-error' },
  swap_request: { icon: 'swap_horiz', iconBg: 'bg-primary/10 text-primary' },
  swap_approved: { icon: 'check_circle', iconBg: 'bg-success/10 text-success' },
  swap_rejected: { icon: 'cancel', iconBg: 'bg-error/10 text-error' },
  burnout_alert: { icon: 'monitor_heart', iconBg: 'bg-error/10 text-error' },
  reminder: { icon: 'event_note', iconBg: 'bg-primary/10 text-primary' },
  info: { icon: 'info', iconBg: 'bg-primary/10 text-primary' },
}

function relativeTime(iso) {
  if (!iso) return ''
  try {
    const diff = Date.now() - new Date(iso).getTime()
    if (diff < 0) return 'just now'
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins} min ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} hr ago`
    return `${Math.floor(hrs / 24)}d ago`
  } catch { return '' }
}

// First letter of first name + first letter of last name, uppercased.
// "Aisha Patel" -> "AP". "Marcus" -> "MA". Falls back to "?".
function initialsFor(name) {
  if (!name) return '?'
  const parts = String(name).trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function TopBar({ user, activeRole, title, subtitle, actions }) {
  const mobileNav = useContext(MobileNavContext)
  const [showNotifs, setShowNotifs] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const notifRef = useRef(null)

  // Real notifications from the API. Re-fetch every time the dropdown opens
  // and every 60s while it's open so newly auto-assigned shifts surface fast.
  const [notifs, setNotifs] = useState([])
  const [notifsLoading, setNotifsLoading] = useState(false)

  async function refreshNotifs() {
    setNotifsLoading(true)
    try {
      const list = await realAPI.getNotifications()
      const sorted = (list || []).slice().sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0
        return tb - ta
      })
      setNotifs(sorted)
    } catch {
      // Silent — if the user isn't authed yet, leave the bell empty.
      setNotifs([])
    } finally {
      setNotifsLoading(false)
    }
  }

  useEffect(() => {
    if (showNotifs) {
      refreshNotifs()
      const id = setInterval(refreshNotifs, 60_000)
      return () => clearInterval(id)
    }
  }, [showNotifs])

  async function markRead(id) {
    try {
      await realAPI.markNotificationRead(id)
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'read' } : n)))
    } catch {
      // ignore
    }
  }

  async function markAllRead() {
    try {
      await realAPI.markAllNotificationsRead()
      setNotifs((prev) => prev.map((n) => ({ ...n, status: 'read' })))
    } catch {
      // ignore
    }
  }

  const notifications = notifs.map((n) => {
    const style = NOTIF_STYLE[n.type] || NOTIF_STYLE.info
    return {
      id: n.id,
      icon: style.icon,
      iconBg: style.iconBg,
      title: n.title || n.type || 'Notification',
      body: n.body || '',
      time: relativeTime(n.created_at),
      unread: n.status !== 'read',
      link: n.link || null,
    }
  })

  const unreadCount = notifications.filter((n) => n.unread).length

  const toggleTheme = useCallback(() => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('gs_theme', next ? 'dark' : 'light')
  }, [dark])
  const menuRef = useRef(null)
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false)
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function signOut() {
    realAPI.clearSession()
    setShowMenu(false)
    toast.push('Signed out', { tone: 'info' })
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-20 h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 px-4 md:px-6 flex items-center justify-between gap-2">
      <div className="flex items-center gap-sm min-w-0 flex-1">
        <button
          onClick={() => mobileNav?.setOpen(true)}
          aria-label="Open menu"
          className="btn-icon md:hidden"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <div className="min-w-0">
          {title && (
            <h1 className="font-headline-md text-headline-md text-on-surface truncate leading-tight">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="hidden md:block font-body-sm text-body-sm text-on-surface-variant truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-sm flex-shrink-0">
        <div className="relative hidden md:block">
          <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search people, shifts, swaps…"
            onFocus={() => setShowSearch(true)}
            onBlur={() => setShowSearch(false)}
            className="w-[260px] pl-xl pr-md py-sm rounded-xl bg-surface-variant/60 border border-transparent focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-body-sm font-body-sm text-on-surface placeholder:text-on-surface-variant/60"
          />
        </div>

        {actions}

        <button
          onClick={toggleTheme}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="btn-icon"
        >
          <span className="material-symbols-outlined">{dark ? 'light_mode' : 'dark_mode'}</span>
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            aria-label="Notifications"
            className="btn-icon relative hidden sm:inline-flex"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 top-full mt-sm w-[min(380px,calc(100vw-1rem))] bg-surface rounded-xl shadow-soft-lg overflow-hidden"
              >
                <div className="flex items-center justify-between px-md py-sm border-b border-outline-variant/30">
                  <h3 className="font-label-md text-label-md text-on-surface">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="font-label-sm text-label-sm text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
                  {notifsLoading && notifications.length === 0 && (
                    <div className="px-md py-lg text-center text-on-surface-variant text-sm">Loading…</div>
                  )}
                  {!notifsLoading && notifications.length === 0 && (
                    <div className="px-md py-lg text-center text-on-surface-variant text-sm">
                      <span className="material-symbols-outlined text-[32px] block mb-1">notifications_none</span>
                      You're all caught up
                    </div>
                  )}
                  {notifications.map((n) => (
                    <div
                      key={n.id || n.title}
                      onClick={() => {
                        if (n.unread) markRead(n.id)
                        setShowNotifs(false)
                        toast.push(n.title, { tone: 'info' })
                      }}
                      className={`flex gap-sm px-md py-sm border-b border-outline-variant/20 hover:bg-surface-variant/50 transition-colors cursor-pointer ${
                        n.unread ? 'bg-primary/[0.02]' : ''
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${n.iconBg}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">{n.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-1.5">
                          <p className="font-label-md text-label-md text-on-surface truncate">
                            {n.title}
                          </p>
                          {n.unread && (
                            <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          )}
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                          {n.body}
                        </p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                          {n.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-md py-sm border-t border-outline-variant/30 text-center">
                  <button
                    onClick={() => { setShowNotifs(false); navigate('/app/notifications') }}
                    className="font-label-sm text-label-sm text-primary hover:underline"
                  >
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Account menu"
            className="rounded-full hover:ring-2 hover:ring-primary/40 transition-all"
          >
            <Avatar src={user.avatar} initials={initialsFor(user.name)} size="md" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 top-full mt-sm w-[240px] bg-surface rounded-xl shadow-soft-lg overflow-hidden"
              >
                <div className="px-md py-sm border-b border-outline-variant/30">
                  <div className="font-label-md text-label-md text-on-surface font-bold truncate">
                    {user.name}
                  </div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant truncate">
                    {user.title}
                  </div>
                  <div className="mt-xs inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-sm py-0.5 font-label-sm text-label-sm font-medium">
                    <span className="material-symbols-outlined text-[14px]">
                      {ROLES[user.role]?.icon || 'person'}
                    </span>
                    {ROLES[user.role]?.name || user.role}
                  </div>
                </div>
                <div className="py-xs">
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      navigate('/app/profile')
                    }}
                    className="w-full text-left flex items-center gap-sm px-md py-sm text-on-surface hover:bg-surface-variant/60 transition-colors font-body-sm text-body-sm"
                  >
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                      person
                    </span>
                    Profile
                  </button>
                  <div className="my-xs border-t border-outline-variant/30" />
                  <button
                    onClick={signOut}
                    className="w-full text-left flex items-center gap-sm px-md py-sm text-error hover:bg-error/5 transition-colors font-body-sm text-body-sm font-medium"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}