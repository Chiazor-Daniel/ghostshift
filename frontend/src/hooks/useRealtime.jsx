import { useEffect, useRef } from 'react'
import { useWebSocket } from './useWebSocket.jsx'
import { useToast } from '../components/Toast.jsx'
import { realAPI } from '../services/realAPI.js'

/**
 * Polls notifications + listens on WebSocket for live updates.
 * Dispatches `gs:data-changed` so pages can refresh without full reload.
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
          // Only toast notifications that arrive after initial load.
          if (bootstrapped.current && n.status !== 'read') {
            toast.push(n.body || n.title || 'New notification', {
              tone: 'info',
              duration: 6500,
              title: n.title && n.body ? n.title : undefined,
            })
            window.dispatchEvent(new CustomEvent('gs:data-changed', { detail: { type: 'notification', id: n.id } }))
          }
        }
        bootstrapped.current = true
      } catch {
        /* ignore transient network errors */
      }
    }

    pollNotifications()
    const interval = setInterval(pollNotifications, 25000)
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
      window.dispatchEvent(new CustomEvent('gs:data-changed', { detail: msg }))
    })

    return unsub
  }, [user?.id, subscribe, toast])

  // Refresh data when user returns to the tab.
  useEffect(() => {
    const bump = () => window.dispatchEvent(new CustomEvent('gs:data-changed'))
    const onVis = () => { if (document.visibilityState === 'visible') bump() }
    window.addEventListener('focus', bump)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('focus', bump)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return { connected }
}
