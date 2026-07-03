import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useState, useCallback } from 'react'

export default function MarketingNav() {
  const { scrollY } = useScroll()
  const blur = useTransform(scrollY, [0, 40], [0, 12])
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const toggleTheme = useCallback(() => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('gs_theme', next ? 'dark' : 'light')
  }, [dark])

  return (
    <motion.nav
      style={{ backdropFilter: blur.get() ? `blur(${blur.get()}px)` : undefined }}
      className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/20"
    >
      <div className="max-w-[1280px] mx-auto px-lg lg:px-xl flex items-center justify-between h-[72px]">
        <Link to="/" className="flex items-center gap-sm group">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold shadow-soft-sm group-hover:scale-105 transition-transform">
            G
          </div>
          <div>
            <div className="font-headline-md text-lg font-bold text-on-surface leading-none">
              GhostShift
            </div>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-xl">
          {[
            { label: 'Product', to: '/#product' },
            { label: 'How it works', to: '/#how' },
            { label: 'Use Cases', to: '/#use-cases' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.to}
              className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-sm">
          <button onClick={toggleTheme} className="btn-icon-sm hidden sm:flex" aria-label="Toggle theme">
            <span className="material-symbols-outlined text-[20px]">{dark ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <Link to="/login" className="btn-ghost hidden sm:inline-flex">
            Sign in
          </Link>
          <Link to="/signup" className="btn-secondary hidden sm:inline-flex">
            Create account
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-xs rounded-lg hover:bg-surface-variant/50"
            aria-label="menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-outline-variant/20 bg-surface px-lg py-md space-y-md">
          <div className="flex flex-col gap-2">
            {[
              { label: 'Product', to: '/#product' },
              { label: 'How it works', to: '/#how' },
              { label: 'Use Cases', to: '/#use-cases' },
            ].map((item) => (
              <a key={item.label} href={item.to} onClick={() => setOpen(false)} className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface py-1">
                {item.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/20">
            <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary py-xs px-sm text-xs">
              Sign in
            </Link>
            <Link to="/signup" onClick={() => setOpen(false)} className="btn-primary py-xs px-sm text-xs">
              Create account
            </Link>
            <button onClick={toggleTheme} className="btn-secondary py-xs px-sm text-xs flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">{dark ? 'light_mode' : 'dark_mode'}</span>
              {dark ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>
      )}
    </motion.nav>
  )
}