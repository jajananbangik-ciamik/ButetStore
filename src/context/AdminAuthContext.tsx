import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiPost } from '../lib/api'
import type { AdminSession } from '../types'

const sessionKey = 'butet-admin-session-v1'
const clientKey = 'butet-admin-client-id'

interface AdminAuthContextValue {
  session: AdminSession | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

function readSession() {
  try {
    const stored = sessionStorage.getItem(sessionKey)
    return stored ? JSON.parse(stored) as AdminSession : null
  } catch {
    return null
  }
}

function getClientId() {
  const existing = sessionStorage.getItem(clientKey)
  if (existing) {
    return existing
  }
  const value = crypto.randomUUID()
  sessionStorage.setItem(clientKey, value)
  return value
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(readSession)
  const [loading, setLoading] = useState(Boolean(session))

  useEffect(() => {
    if (!session) {
      setLoading(false)
      return
    }
    let active = true
    apiPost<{ expiresAt: number }>({ action: 'adminSession', sessionToken: session.sessionToken })
      .then((current) => {
        if (active) {
          const next = { ...session, expiresAt: current.expiresAt }
          setSession(next)
          sessionStorage.setItem(sessionKey, JSON.stringify(next))
        }
      })
      .catch(() => {
        if (active) {
          setSession(null)
          sessionStorage.removeItem(sessionKey)
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const next = await apiPost<AdminSession>({ action: 'adminLogin', username, password, clientId: getClientId() })
    setSession(next)
    sessionStorage.setItem(sessionKey, JSON.stringify(next))
  }, [])

  const logout = useCallback(async () => {
    const current = readSession()
    if (current) {
      try {
        await apiPost({ action: 'adminLogout', sessionToken: current.sessionToken })
      } catch {
        sessionStorage.removeItem(sessionKey)
      }
    }
    setSession(null)
    sessionStorage.removeItem(sessionKey)
  }, [])

  const value = useMemo(() => ({ session, loading, login, logout }), [session, loading, login, logout])
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth harus digunakan di dalam AdminAuthProvider.')
  }
  return context
}
