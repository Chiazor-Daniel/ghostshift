import { useEffect, useRef } from 'react'
import { useWebSocket } from './useWebSocket.jsx'
import { useToast } from '../components/Toast.jsx'
import { realAPI } from '../services/realAPI.js'

let _lastDataBump = 0

function bumpDataChanged(detail) {
  const now = Date.now()
  // Coalesce bursts — max one global refresh wave every 2s.
  if (now - _lastDataBump < 2000) return
  _lastDataBump = now
  window.dispatchEvent(new CustomEvent('gs:data-changed', { detail }))
}

/**
 * Polls notifications + listens on WebSocket for live updates.
 * Dispatches debounced gs:data-changed so pages don't refetch in a storm.
 */
export function useRealtime(user) {
  const toast = useToast()
  const seenIds = useRef(new Set())
  const bootstrapped = useRef(false)
  const { subscribe, connected } = useWebSocket(user?.id)

  useEffect(() => {
    if (!user?.id) return

    async function pollNotifications() {
      try {
        const notifs = await realAPI.getNotifications()
        for (const n of notifs || []) {
          if (seenIds.current.has(n.id)) continue
          seenIds.current.add(n.id)
          if (bootstrapped.current && n.status !== 'read') {
            toast.push(n.body || n.title || 'New notification', {
              tone: 'info',
              duration: 6500,
              title: n.title && n.body ? n.title : undefined,
            })
            bumpDataChanged({ type: 'notification', id: n.id })
          }
        }
        bootstrapped.current = true
      } catch {
        /* ignore */
      }
    }

    pollNotifications()
    const interval = setInterval(pollNotifications, 60_000)
    return () => clearInterval(interval)
  }, [user?.id, toast])

  useEffect(() => {
    if (!user?.id) return

    const unsub = subscribe('*', (msg) => {
      const text = msg.body || msg.title
      if (text) {
        toast.push(text, {
          tone: msg.type?.includes('error') ? 'error' : msg.type?.includes('approved') ? 'success' : 'info',
          duration: 6500,
          title: msg.title && msg.body ? msg.title : undefined,
        })
      }
      bumpDataChanged(msg)
    })

    return unsub
  }, [user?.id, subscribe, toast])

  return { connected }
}
