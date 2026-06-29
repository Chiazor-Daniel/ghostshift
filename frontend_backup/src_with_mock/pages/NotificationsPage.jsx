import { useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, Badge } from '../components/ui.jsx'
import { useToast } from '../components/Toast.jsx'
import { getNotifications, markNotificationRead, markAllNotificationsRead, formatDate } from '../data/store.js'

const iconForType = (type) => {
  if (type.startsWith('swap')) return { icon: 'swap_horiz', color: 'primary' }
  if (type.startsWith('shift')) return { icon: 'event_available', color: 'success' }
  if (type === 'welcome' || type === 'info') return { icon: 'info', color: 'info' }
  return { icon: 'notifications', color: 'primary' }
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'swap', label: 'Swaps' },
  { id: 'shift', label: 'Shifts' },
  { id: 'info', label: 'Info' },
]

const iconTile = (color) =>
  color === 'primary'
    ? 'bg-primary/10 text-primary'
    : color === 'error'
      ? 'bg-error/10 text-error'
      : color === 'success'
        ? 'bg-success/10 text-success'
        : 'bg-info/10 text-info'

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(() => getNotifications())
  const [filter, setFilter] = useState('all')
  const [prefs, setPrefs] = useState(() => {
    try {
      const stored = localStorage.getItem('gs_notification_prefs')
      if (stored) return JSON.parse(stored)
    } catch {}
    return {
      swap: { on: true, channel: 'push' },
      shift: { on: true, channel: 'push' },
      info: { on: true, channel: 'email' },
    }
  })
  const toast = useToast()

  const refresh = useCallback(() => setNotifications(getNotifications()), [])

  const unreadCount = notifications.filter((n) => n.unread).length

  const visible = useMemo(() => {
    if (filter === 'all') return notifications
    if (filter === 'unread') return notifications.filter((n) => n.unread)
    return notifications.filter((n) => n.type.startsWith(filter))
  }, [notifications, filter])

  function handleToggleRead(nid) {
    markNotificationRead(nid)
    refresh()
  }

  function handleMarkAllRead() {
    markAllNotificationsRead()
    refresh()
    toast.push('All notifications marked as read', { tone: 'success' })
  }

  function togglePref(key) {
    setPrefs((p) => {
      const next = { ...p, [key]: { ...p[key], on: !p[key].on } }
      localStorage.setItem('gs_notification_prefs', JSON.stringify(next))
      return next
    })
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display-sm font-bold text-on-surface">Notifications</h1>
      </div>
      <section className="page-section">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8">
            <Card className="p-0 overflow-hidden" hover={false}>
              <div className="px-4 py-3 border-b border-outline-variant/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-sm">
                  <h2 className="font-headline-md text-headline-md text-on-surface font-bold">All notifications</h2>
                  {unreadCount > 0 && (
                    <Badge variant="primary">{unreadCount} new</Badge>
                  )}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {FILTERS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilter(f.id)}
                      className={`px-2 py-1 rounded-md font-label-sm text-label-sm transition-colors ${
                        filter === f.id
                          ? 'bg-primary/10 text-primary font-bold'
                          : 'text-on-surface-variant hover:bg-surface-variant'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-outline-variant/20">
                {visible.length === 0 && (
                  <div className="px-4 py-12 text-center">
                    <span className="material-symbols-outlined text-on-surface-variant text-[32px]">
                      notifications_off
                    </span>
                    <p className="mt-sm font-body-sm text-body-sm text-on-surface-variant">
                      No notifications in this view
                    </p>
                  </div>
                )}
                {visible.map((n, i) => {
                  const ico = iconForType(n.type)
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.02, 0.2) }}
                      className={`px-4 py-4 flex items-start gap-3 hover:bg-surface-variant/40 cursor-pointer ${
                        n.unread ? 'bg-primary/[0.02]' : ''
                      }`}
                      onClick={() => handleToggleRead(n.id)}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconTile(ico.color)}`}>
                        <span className="material-symbols-outlined text-[20px]">{ico.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-sm">
                          <h3 className="font-label-md text-label-md font-bold text-on-surface truncate">
                            {n.type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </h3>
                          {n.unread && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{n.body}</p>
                        <div className="mt-1 font-label-sm text-label-sm text-on-surface-variant">{relativeTime(n.time)}</div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toast.push('Manage notification — coming soon', { tone: 'info' }) }}
                        className="text-on-surface-variant hover:text-on-surface"
                        aria-label="More options"
                      >
                        <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                      </button>
                    </motion.div>
                  )
                })}
              </div>
            </Card>
          </div>

          <aside className="lg:col-span-4 space-y-4">
            <Card hover={false}>
              <CardHeader icon="tune" title="Notification preferences" />
              <div className="mt-4 space-y-2">
                {Object.entries(prefs).map(([key, pref]) => (
                  <div key={key} className="flex items-center justify-between py-1 gap-sm">
                    <div className="min-w-0">
                      <div className="font-label-md text-label-md text-on-surface capitalize">{labels[key] || key}</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">{pref.channel}</div>
                    </div>
                    <button
                      onClick={() => togglePref(key)}
                      role="switch"
                      aria-checked={pref.on}
                      aria-label={`Toggle ${labels[key] || key} notifications`}
                      className={`w-10 h-6 rounded-full p-0.5 transition-colors flex-shrink-0 ${
                        pref.on ? 'bg-primary' : 'bg-outline-variant/40'
                      }`}
                    >
                      <span
                        className={`block w-5 h-5 rounded-full bg-surface shadow-soft-sm transition-transform ${
                          pref.on ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            <Card hover={false}>
              <CardHeader icon="done_all" title="Actions" />
              <div className="mt-4 space-y-2">
                <button
                  onClick={handleMarkAllRead}
                  className="w-full btn-secondary"
                >
                  <span className="material-symbols-outlined text-[18px]">done_all</span>
                  Mark all as read
                </button>
              </div>
            </Card>
          </aside>
        </div>
      </section>
    </>
  )
}

const labels = {
  swap: 'Swap requests',
  shift: 'Shift updates',
  info: 'System info',
}
