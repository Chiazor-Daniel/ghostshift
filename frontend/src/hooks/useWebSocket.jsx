import { useEffect, useRef, useState, useCallback } from 'react'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'

export function useWebSocket(userId) {
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState(null)
  const listenersRef = useRef(new Map())

  const connect = useCallback(() => {
    if (!userId) return

    try {
      const ws = new WebSocket(`${WS_URL}/${userId}`)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[WS] Connected')
        setConnected(true)
        // Subscribe to org-wide channel for real-time updates
        ws.send(JSON.stringify({ action: 'subscribe', channel: 'org_updates' }))
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          setLastMessage(message)
          
          // Notify listeners
          const type = message.type
          if (listenersRef.current.has(type)) {
            listenersRef.current.get(type).forEach(callback => callback(message))
          }
          // Also notify wildcard listeners
          if (listenersRef.current.has('*')) {
            listenersRef.current.get('*').forEach(callback => callback(message))
          }
        } catch (err) {
          console.error('[WS] Failed to parse message:', err)
        }
      }

      ws.onerror = (error) => {
        console.error('[WS] Error:', error)
      }

      ws.onclose = () => {
        console.log('[WS] Disconnected, reconnecting in 3s...')
        setConnected(false)
        reconnectTimeoutRef.current = setTimeout(connect, 3000)
      }
    } catch (err) {
      console.error('[WS] Failed to connect:', err)
      reconnectTimeoutRef.current = setTimeout(connect, 3000)
    }
  }, [userId])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setConnected(false)
  }, [])

  const send = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  const subscribe = useCallback((eventType, callback) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set())
    }
    listenersRef.current.get(eventType).add(callback)
    
    return () => {
      listenersRef.current.get(eventType)?.delete(callback)
    }
  }, [])

  useEffect(() => {
    if (userId) {
      connect()
    }
    return () => {
      disconnect()
    }
  }, [userId, connect, disconnect])

  return {
    connected,
    lastMessage,
    send,
    subscribe,
    disconnect,
    reconnect: connect,
  }
}
