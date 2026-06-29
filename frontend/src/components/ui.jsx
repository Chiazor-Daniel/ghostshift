import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const cardBase = 'rounded-xl shadow-soft-md bg-gradient-to-b from-surface to-surface-dim'

export function Card({ children, className = '', hover = true, animate = false, ...props }) {
  const classes = `${cardBase} p-lg ${hover ? 'card-hover' : ''} ${className}`
  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        whileHover={hover ? { y: -2 } : undefined}
        className={classes}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action, icon, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-md mb-lg ${className}`}>
      <div className="flex items-start gap-sm min-w-0">
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-surface-variant text-on-surface-variant flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
          </div>
        )}
        <div className="min-w-0 pt-px">
          <h3 className="font-headline-md text-base font-semibold text-on-surface leading-tight">{title}</h3>
          {subtitle && (
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

export function StatCard({ label, value, change, changeType, icon, className = '' }) {
  return (
    <div className={`${cardBase} p-lg flex flex-col gap-sm ${className}`}>
      <div className="flex items-center justify-between">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">{label}</span>
        {icon && (
          <span className="w-8 h-8 rounded-lg bg-surface-variant text-on-surface-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
          </span>
        )}
      </div>
      <div className="font-headline-lg text-headline-lg text-on-surface leading-none">{value}</div>
      {change && (
        <div
          className={`flex items-center gap-1 font-label-sm text-label-sm ${
            changeType === 'up' ? 'text-success' : changeType === 'down' ? 'text-error' : 'text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">
            {changeType === 'up' ? 'trending_up' : changeType === 'down' ? 'trending_down' : 'remove'}
          </span>
          {change}
        </div>
      )}
    </div>
  )
}

export function Badge({ children, variant = 'neutral', className = '' }) {
  const variants = {
    neutral: 'bg-surface-variant text-on-surface-variant',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/15 text-warning',
    error: 'bg-error/10 text-error',
    info: 'bg-accent/10 text-accent',
  }
  return <span className={`chip ${variants[variant]} ${className}`}>{children}</span>
}

export function ProgressBar({ value, max = 100, color = 'primary', className = '', showValue = false }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const colors = {
    primary: 'bg-primary',
    accent: 'bg-accent',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
  }
  return (
    <div className={`w-full bg-surface-container rounded-full h-1.5 overflow-hidden ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className={`h-full rounded-full ${colors[color] ?? colors.primary}`}
      />
      {showValue && <span className="sr-only">{Math.round(pct)}%</span>}
    </div>
  )
}

export function Avatar({ src, initials = '?', size = 'md', status, className = '' }) {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  }
  const statusSize = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
  }
  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={initials}
          loading="lazy"
          className={`${sizes[size]} rounded-full object-cover border border-outline-variant/60 bg-surface-variant`}
        />
      ) : (
        <div
          className={`${sizes[size]} rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center font-semibold border border-outline-variant/60`}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={`absolute bottom-0 right-0 ${statusSize[size]} rounded-full border-2 border-surface ${
            status === 'online' ? 'bg-success' : status === 'away' ? 'bg-warning' : 'bg-on-surface-variant'
          }`}
        />
      )}
    </div>
  )
}

export function Modal({ open, onClose, children, title, subtitle, maxWidth = 'max-w-lg', size }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  const mw = size === 'lg' ? 'max-w-2xl' : size === 'xl' ? 'max-w-4xl' : maxWidth
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-md bg-on-surface/45 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0" onClick={onClose} />
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ scale: 0.97, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className={`relative bg-surface rounded-xl shadow-soft-xl w-full ${mw} max-h-[90vh] overflow-hidden flex flex-col`}
      >
        {(title || subtitle) && (
          <div className="px-lg py-md border-b border-outline-variant/60 flex items-start justify-between">
            <div>
              {title && <h2 className="font-headline-md text-lg font-semibold text-on-surface">{title}</h2>}
              {subtitle && <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{subtitle}</p>}
            </div>
            <button onClick={onClose} aria-label="Close" className="btn-icon">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto scrollbar-thin">{children}</div>
      </motion.div>
    </div>
  )
}

export function Drawer({ open, onClose, children, title, subtitle, side = 'right', width = 'w-[480px]', size }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  const w = size === 'md' ? 'w-[560px]' : width
  return (
    <div className="fixed inset-0 z-[100] bg-on-surface/35 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0" onClick={onClose} />
      <motion.aside
        initial={{ x: side === 'right' ? '100%' : '-100%' }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className={`absolute top-0 ${side === 'right' ? 'right-0' : 'left-0'} h-full ${w} max-w-full bg-surface shadow-soft-xl ${side === 'right' ? 'rounded-l-xl' : 'rounded-r-xl'} flex flex-col`}
      >
        {(title || subtitle) && (
          <div className="px-lg py-md border-b border-outline-variant/60 flex items-start justify-between">
            <div>
              {title && <h2 className="font-headline-md text-lg font-semibold text-on-surface">{title}</h2>}
              {subtitle && <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{subtitle}</p>}
            </div>
            <button onClick={onClose} aria-label="Close" className="btn-icon">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto scrollbar-thin">{children}</div>
      </motion.aside>
    </div>
  )
}

export function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex items-center gap-xs bg-surface-variant/60 p-xs rounded-lg w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-md py-xs rounded-md transition-all font-label-md text-label-md ${
            activeTab === tab.id
              ? 'bg-surface shadow-soft-sm text-primary font-semibold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export function EmptyState({ icon = 'inbox', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-2xl text-center">
      <div className="w-14 h-14 rounded-2xl bg-surface-variant flex items-center justify-center mb-md">
        <span className="material-symbols-outlined text-on-surface-variant text-[26px]">{icon}</span>
      </div>
      <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">{title}</h3>
      {description && <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs max-w-xs">{description}</p>}
      {action && <div className="mt-md">{action}</div>}
    </div>
  )
}

export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-10 h-10 border-[3px]' }
  return (
    <div
      className={`${sizes[size]} border-primary/25 border-t-primary rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}

export function Skeleton({ className = '', w, h }) {
  return (
    <div className={`relative overflow-hidden rounded-md bg-surface-container ${className}`} style={{ width: w, height: h }}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
  )
}

export function Select({ value, onChange, options = [], placeholder = 'Select...', className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = options.find((o) => o.value === value)

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-outline-variant/70 bg-surface px-md py-sm text-body-sm text-left transition-all hover:border-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <span className={selected ? 'text-on-surface' : 'text-on-surface-variant/55'}>{selected ? selected.label : placeholder}</span>
        <span className={`material-symbols-outlined text-[18px] text-on-surface-variant transition-transform ${open ? 'rotate-180' : ''}`}>expand_more</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-outline-variant/70 bg-surface shadow-soft-lg py-1 max-h-56 overflow-y-auto scrollbar-thin">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-md py-2 text-body-sm text-left transition-colors hover:bg-surface-container ${
                opt.value === value ? 'text-primary font-semibold bg-primary/5' : 'text-on-surface'
              }`}
            >
              {opt.value === value && <span className="material-symbols-outlined text-[16px] text-primary">check</span>}
              <span className={opt.value === value ? '' : 'ml-6'}>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
