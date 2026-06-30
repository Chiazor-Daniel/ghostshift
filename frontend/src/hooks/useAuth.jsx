import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { realAPI } from '../services/realAPI.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => realAPI.user)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!realAPI.token) return
    setLoading(true)
    try {
      const me = await realAPI.getMe()
      const merged = { ...realAPI.user, ...me }
      realAPI.user = merged
      localStorage.setItem('gs_user', JSON.stringify(merged))
      setUser(merged)
    } catch (err) {
      // 401 → clear and bounce to login. Swallow any localStorage error so we
      // never tear the React tree (was breaking the login form on mobile).
      if (err.status === 401) {
        try { realAPI.clearSession() } catch { /* ignore */ }
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Only attempt a session refresh when we actually have a token AND a user
    // shape from a previous login. A token with no user is stale and the
    // /auth/me round-trip is what was crashing the login page.
    if (realAPI.token && realAPI.user && realAPI.user.id) {
      refresh()
    }
  }, [refresh])

  const login = useCallback(async (email, password) => {
    const data = await realAPI.login({ email, password })
    setUser(data.user)
    return data
  }, [])

  const signup = useCallback(async (payload) => {
    const data = await realAPI.onboard(payload)
    setUser(data.user)
    return data
  }, [])

  const logout = useCallback(() => {
    realAPI.clearSession()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}