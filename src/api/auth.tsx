import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getToken, setToken } from './client'
import { adminLogin, adminMe, adminLogout } from './endpoints'
import type { Admin } from './types'

interface AuthValue {
  admin: Admin | null
  ready: boolean // initial session check finished
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthCtx = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [ready, setReady] = useState(false)

  // Validate an existing token on load.
  useEffect(() => {
    let alive = true
    ;(async () => {
      if (getToken()) {
        try {
          const me = await adminMe()
          if (alive) setAdmin(me)
        } catch {
          setToken(null)
        }
      }
      if (alive) setReady(true)
    })()
    return () => { alive = false }
  }, [])

  const login = async (email: string, password: string) => {
    await adminLogin(email, password)
    // adminLogin stored the token; confirm it and load the profile.
    setAdmin(await adminMe())
  }

  const logout = async () => {
    await adminLogout()
    setAdmin(null)
  }

  return <AuthCtx.Provider value={{ admin, ready, login, logout }}>{children}</AuthCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const v = useContext(AuthCtx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}
