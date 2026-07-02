import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, Badge, ListSkeleton, Pagination } from '../components/ui.jsx'
import { useToast } from '../components/Toast.jsx'
import { realAPI } from '../services/realAPI.js'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
]

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
    const days = Math.floor(hrs / 24)
    return `${days} day${days > 1 ? 's' : ''} ago`
  } catch {
    return ''
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const toast = useToast()

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    try {
      const data = await realAPI.getNotifications()
      setNotifications(data || [])
    } catch (err) {
      toast.push(err.message || 'Could not load notifications', { tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read_at && !n.readAt).length

  const visible = useMemo(() => {
    if (filter === 'all') return notifications
    if (filter === 'unread') return notifications.filter((n) => !n.read_at && !n.readAt)
    return notifications
  }, [notifications, filter])

  useEffect(() => { setPage(1) }, [filter])

  const PAGE_SIZE = 12
  const pageItems = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function handleToggleRead(n) {
    if (n.read_at || n.readAt) return
    try {
      await realAPI.markNotificationRead(n.id)
      refresh()
    } catch (err) {
      toast.push(err.message || 'Could not update', { tone: 'error' })
    }
  }

  async function handleMarkAllRead() {
    if (markingAll) return
    const unread = notifications.filter((n) => !n.read_at && !n.readAt)
    if (unread.length === 0) return
    setMarkingAll(true)
    try {
      // Use the bulk endpoint if available — falls back to per-item loop otherwise.
      try {
        await realAPI.markAllNotificationsRead()
      } catch {
        for (const n of unread) {
          try { await realAPI.markNotificationRead(n.id) } catch {}
        }
      }
      refresh()
      toast.push('All notifications marked as read', { tone: 'success' })
    } finally {
      setMarkingAll(false)
    }
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
                  {unreadCount > 0 && <Badge variant="primary">{unreadCount} new</Badge>}
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
                {loading ? (
                  <div className="p-md"><ListSkeleton variant="row" count={5} /></div>
                ) : visible.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <span className="material-symbols-outlined text-on-surface-variant text-[32px]">notifications_off</span>
                    <p className="mt-sm font-body-sm text-body-sm text-on-surface-variant">No notifications in this view</p>
                  </div>
                ) : (
                  pageItems.map((n, i) => {
                    const isUnread = !n.read_at && !n.readAt
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.2) }}
                        className={`px-4 py-4 flex items-start gap-3 hover:bg-surface-variant/40 cursor-pointer ${isUnread ? 'bg-primary/[0.02]' : ''}`}
                        onClick={() => handleToggleRead(n)}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10 text-primary">
                          <span className="material-symbols-outlined text-[20px]">notifications</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-sm">
                            <h3 className="font-label-md text-label-md font-bold text-on-surface truncate">{n.title || n.type || 'Notification'}</h3>
                            {isUnread && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                          </div>
                          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{n.body || n.message || ''}</p>
                          <div className="mt-1 font-label-sm text-label-sm text-on-surface-variant">{relativeTime(n.created_at || n.createdAt || n.time)}</div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
                {!loading && visible.length > PAGE_SIZE && (
                  <div className="px-4 py-3 border-t border-outline-variant/20">
                    <Pagination page={page} pageSize={PAGE_SIZE} total={visible.length} onChange={setPage} />
                  </div>
                )}
              </div>
            </Card>
          </div>

          <aside className="lg:col-span-4 space-y-4">
            <Card hover={false}>
              <CardHeader icon="done_all" title="Actions" />
              <div className="mt-4 space-y-2">
                <button onClick={handleMarkAllRead} disabled={unreadCount === 0 || markingAll} className="w-full btn-secondary disabled:opacity-40">
                  <span className="material-symbols-outlined text-[18px]">{markingAll ? 'progress_activity' : 'done_all'}</span>
                  {markingAll ? 'Marking…' : `Mark all as read (${unreadCount})`}
                </button>
                <button onClick={refresh} className="w-full btn-ghost">
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  Refresh
                </button>
              </div>
            </Card>
          </aside>
        </div>
      </section>
    </>
  )
}