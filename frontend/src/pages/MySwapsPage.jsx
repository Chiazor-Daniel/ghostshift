import { useState, useEffect } from 'react'
import { Card, CardHeader, EmptyState, ListSkeleton, Pagination, RichListItem } from '../components/ui.jsx'
import { useToast } from '../components/Toast.jsx'
import { useUser } from '../layout/AppShell.jsx'
import { realAPI } from '../services/realAPI.js'
import { formatDate, formatDateFull } from '../data/store.js'

export default function MySwapsPage() {
  const toast = useToast()
  const { user: currentUser } = useUser()
  const [swaps, setSwaps] = useState([])
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!currentUser?.id) return
    refresh()
  }, [currentUser?.id])

  async function refresh() {
    setLoading(true)
    try {
      const [sw, sh] = await Promise.all([
        realAPI.getSwaps({ mine_only: 'true' }),
        realAPI.getShifts(),
      ])
      setSwaps(sw || [])
      setShifts(sh || [])
    } catch (err) {
      toast.push(err.message || 'Could not load swap requests', { tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const shiftById = (id) => shifts.find((s) => s.id === id)

  const pending = swaps.filter((s) => s.status === 'pending')
  const approved = swaps.filter((s) => s.status === 'approved')
  const declined = swaps.filter((s) => s.status === 'declined' || s.status === 'rejected')

  const sorted = swaps
    .slice()
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))

  const PAGE_SIZE = 8
  const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const statusMeta = (s) => {
    if (s.status === 'approved') return { variant: 'success', icon: 'check_circle', label: 'Approved' }
    if (s.status === 'declined' || s.status === 'rejected') return { variant: 'error', icon: 'cancel', label: 'Declined' }
    return { variant: 'warning', icon: 'hourglass_top', label: 'Pending' }
  }

  const kindLabel = (s) => {
    if (s.kind === 'pickup') return 'Shift pickup'
    if (s.kind === 'release') return 'Give up shift'
    if (s.kind === 'swap') return 'Swap trade'
    return 'Request'
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display-sm font-bold text-on-surface">My Swap Requests</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Track your shift pickups, trades, and give-up requests.
        </p>
      </div>

      <section className="page-section">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card hover>
            <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Total requests</div>
            <div className="font-headline-lg text-headline-lg font-bold text-on-surface mt-1">{swaps.length}</div>
          </Card>
          <Card hover>
            <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Pending</div>
            <div className="font-headline-lg text-headline-lg font-bold text-warning mt-1">{pending.length}</div>
          </Card>
          <Card hover>
            <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Approved</div>
            <div className="font-headline-lg text-headline-lg font-bold text-success mt-1">{approved.length}</div>
          </Card>
          <Card hover>
            <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Declined</div>
            <div className="font-headline-lg text-headline-lg font-bold text-error mt-1">{declined.length}</div>
          </Card>
        </div>

        <Card hover={false}>
          <CardHeader icon="swap_horiz" title="Your requests" />
          {loading ? (
            <div className="mt-md"><ListSkeleton variant="row" count={4} /></div>
          ) : swaps.length === 0 ? (
            <EmptyState
              icon="swap_horiz"
              title="No swap requests"
              description="You haven't requested any shift changes yet. Open a shift from your portal to swap, give up, or pick up hours."
            />
          ) : (
            <div className="space-y-sm mt-md">
              {pageItems.map((sw) => {
                const fromShift = shiftById(sw.from_shift_id || sw.requester_shift_id)
                const toShift = shiftById(sw.to_shift_id || sw.responder_shift_id || sw.target_shift_id)
                const meta = statusMeta(sw)
                const details = []
                if (fromShift) details.push({ label: 'From', value: fromShift.role || fromShift.title, sub: `${formatDateFull(fromShift.date)} · ${fromShift.department}` })
                if (sw.kind === 'release') {
                  details.push({ label: 'Outcome', value: 'Returns to marketplace if approved' })
                } else if (toShift) details.push({ label: 'To', value: toShift.role || toShift.title, sub: `${formatDateFull(toShift.date)} · ${toShift.department}` })
                else if (sw.kind === 'pickup') details.push({ label: 'To', value: 'Open shift' })
                return (
                  <RichListItem
                    key={sw.id}
                    icon={meta.icon}
                    iconColor={meta.variant}
                    title={kindLabel(sw)}
                    subtitle={`Submitted ${formatDate(sw.created_at)}`}
                    status={{ variant: meta.variant, label: meta.label }}
                    meta={sw.ai_score != null && sw.status === 'pending' ? `Fit score: ${sw.ai_score}% — based on department, certs, workload, rest` : undefined}
                    details={details}
                  />
                )
              })}
              {sorted.length > PAGE_SIZE && (
                <Pagination page={page} pageSize={PAGE_SIZE} total={sorted.length} onChange={setPage} />
              )}
            </div>
          )}
        </Card>
      </section>
    </>
  )
}