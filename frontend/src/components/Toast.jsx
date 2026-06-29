import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Lightweight toast system so every clickable can give feedback instead of
// looking dead while the backend is still being wired. Mount <ToastProvider>
// once near the root; call useToast() anywhere to push a toast.

const ToastContext = createContext(null)

let _id = 0

const tones = {
  info: { icon: 'info', cls: 'text-primary', ring: 'ring-primary/20' },
  success: { icon: 'check_circle', cls: 'text-success', ring: 'ring-success/20' },
  warning: { icon: 'warning', cls: 'text-warning', ring: 'ring-warning/20' },
  error: { icon: 'error', cls: 'text-error', ring: 'ring-error/20' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
    if (timers.current[id]) {
      clearTimeout(timers.current[id])
      delete timers.current[id]
    }
  }, [])

  const push = useCallback(
    (message, opts = {}) => {
      const id = ++_id
      const tone = tones[opts.tone] || tones.info
      setToasts((t) => [...t.slice(-4), { id, message, tone, action: opts.action }])
      const ms = opts.duration ?? 3200
      if (ms > 0) {
        timers.current[id] = setTimeout(() => dismiss(id), ms)
      }
      return id
    },
    [dismiss]
  )

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), [])

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      <div
        className="fixed bottom-md md:bottom-xl right-md md:right-xl z-[100] flex flex-col gap-sm pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              className="pointer-events-auto bg-surface rounded-xl shadow-soft-lg border border-outline-variant/60 px-md py-sm flex items-center gap-sm max-w-[min(380px,calc(100vw-2rem))]"
            >
              <span className={`material-symbols-outlined text-[20px] ${t.tone.cls}`}>
                {t.tone.icon}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface flex-1">{t.message}</span>
              {t.action && (
                <button
                  onClick={() => {
                    t.action.onClick?.()
                    dismiss(t.id)
                  }}
                  className="font-label-md text-label-md text-primary font-semibold hover:underline whitespace-nowrap"
                >
                  {t.action.label}
                </button>
              )}
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="text-on-surface-variant hover:text-on-surface -mr-xs"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}