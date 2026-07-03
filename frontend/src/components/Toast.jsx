import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ToastContext = createContext(null)

let _id = 0

const tones = {
  info: { icon: 'info', cls: 'text-primary', bg: 'bg-primary/10', ring: 'ring-primary/25' },
  success: { icon: 'check_circle', cls: 'text-success', bg: 'bg-success/10', ring: 'ring-success/25' },
  warning: { icon: 'warning', cls: 'text-warning', bg: 'bg-warning/10', ring: 'ring-warning/25' },
  error: { icon: 'error', cls: 'text-error', bg: 'bg-error/10', ring: 'ring-error/25' },
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
      setToasts((t) => [...t.slice(-5), { id, message, title: opts.title, tone, action: opts.action }])
      const ms = opts.duration ?? 5000
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
        className="fixed top-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[200] flex flex-col gap-3 pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.22 }}
              className={`pointer-events-auto bg-surface rounded-2xl shadow-soft-lg border border-outline-variant/70 ring-2 ${t.tone.ring} px-4 py-3.5 flex items-start gap-3`}
            >
              <span className={`material-symbols-outlined text-[26px] shrink-0 mt-0.5 ${t.tone.cls}`}>
                {t.tone.icon}
              </span>
              <div className="flex-1 min-w-0">
                {t.title && (
                  <p className="font-label-md text-label-md text-on-surface font-semibold leading-snug">
                    {t.title}
                  </p>
                )}
                <p className={`${t.title ? 'mt-0.5' : ''} text-base text-on-surface leading-snug`}>
                  {t.message}
                </p>
              </div>
              {t.action && (
                <button
                  onClick={() => {
                    t.action.onClick?.()
                    dismiss(t.id)
                  }}
                  className="font-label-md text-label-md text-primary font-semibold hover:underline whitespace-nowrap shrink-0"
                >
                  {t.action.label}
                </button>
              )}
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="text-on-surface-variant hover:text-on-surface shrink-0 -mr-1"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
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
