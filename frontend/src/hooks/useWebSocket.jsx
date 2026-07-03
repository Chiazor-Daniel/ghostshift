import { useEffect, useRef, useState, useCallback } from 'react'
import { realAPI } from '../services/realAPI.js'

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'

export function useWebSocket(userId) {
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState(null)
  const listenersRef = useRef(new Map())

  const connect = useCallback(() => {
    if (!userId || !realAPI.token) return

    try {
      const url = `${WS_BASE}?token=${encodeURIComponent(realAPI.token)}`
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        ws.send(JSON.stringify({ action: 'subscribe', channel: 'org_updates' }))
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          setLastMessage(message)

          const type = message.type
          if (listenersRef.current.has(type)) {
            listenersRef.current.get(type).forEach((callback) => callback(message))
          }
          if (listenersRef.current.has('*')) {
            listenersRef.current.get('*').forEach((callback) => callback(message))
          }
        } catch (err) {
          console.error('[WS] Failed to parse message:', err)
        }
      }

      ws.onerror = () => {
        setConnected(false)
      }

      ws.onclose = () => {
        setConnected(false)
        reconnectTimeoutRef.current = setTimeout(connect, 4000)
      }
    } catch (err) {
      console.error('[WS] Failed to connect:', err)
      reconnectTimeoutRef.current = setTimeout(connect, 4000)
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
    if (wsRef.current?.readyState === WebSocket.OPEN) {
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
    if (userId && realAPI.token) {
      connect()
    }
    return () => disconnect()
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
