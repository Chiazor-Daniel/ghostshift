import Sidebar from '../components/Sidebar.jsx'
import ChatAssistant from '../components/ChatAssistant.jsx'
import { useState, useEffect, createContext, useContext, useMemo, useCallback } from 'react'
import Logo from '../components/Logo.jsx'

export const MobileNavContext = createContext(null)
export const UserContext = createContext(null)

export function useUser() {
  return useContext(UserContext)
}

export default function AppShell({ activeRole, setActiveRole, children }) {
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem('gs_sidebar_collapsed')
    return stored === '1'
  })
  useEffect(() => {
    localStorage.setItem('gs_sidebar_collapsed', collapsed ? '1' : '0')
  }, [collapsed])

  const [mobileOpen, setMobileOpen] = useState(false)
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const toggleTheme = useCallback(() => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('gs_theme', next ? 'dark' : 'light')
  }, [dark])

  const mobileValue = useMemo(() => ({ open: mobileOpen, setOpen: setMobileOpen }), [mobileOpen])
  const resolvedUser = useMemo(() => {
    try {
      const stored = localStorage.getItem('gs_user')
      if (stored) return JSON.parse(stored)
    } catch {}
    return {}
  }, [activeRole])
  const userValue = useMemo(() => ({ user: resolvedUser, activeRole }), [activeRole, resolvedUser])

  return (
    <UserContext.Provider value={userValue}>
      <MobileNavContext.Provider value={mobileValue}>
        <div className="min-h-screen bg-background flex">
          <Sidebar
            user={resolvedUser}
            activeRole={activeRole}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((c) => !c)}
            mobileOpen={mobileOpen}
            onCloseMobile={() => setMobileOpen(false)}
          />
          <div className={`flex-1 flex flex-col min-h-screen overflow-x-hidden transition-[margin] duration-300 ease-out ${
            collapsed ? 'md:ml-[72px]' : 'md:ml-[240px]'
          }`}>
            <main className="flex-1 pt-4 md:pt-6">
              <div className="page-container">{children}</div>
            </main>
          </div>
          <ChatAssistant />
        </div>
      </MobileNavContext.Provider>
    </UserContext.Provider>
  )
}
