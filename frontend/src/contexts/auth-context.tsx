import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { configureAuth } from "@/hooks/use-api"

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  is_active: boolean
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (token: string, user: AuthUser) => void
  register: (token: string, user: AuthUser) => void
  logout: () => void
  setSession: (token: string | null, user: AuthUser | null) => void
  getToken: () => string | null
}

const TOKEN_KEY = "auth_token"
const USER_KEY = "auth_user"

const AuthContext = createContext<AuthContextType | null>(null)

function readStoredSession(): { token: string | null; user: AuthUser | null } {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const rawUser = localStorage.getItem(USER_KEY)
    if (!token || !rawUser) {
      return { token: null, user: null }
    }
    return { token, user: JSON.parse(rawUser) as AuthUser }
  } catch {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    return { token: null, user: null }
  }
}

function persistSession(token: string | null, user: AuthUser | null) {
  if (token && user) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8001")
  .replace(/\/api\/v1\/?$/, "")
  .replace(/\/$/, "")

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    persistSession(null, null)
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    configureAuth(
      () => token ?? localStorage.getItem(TOKEN_KEY),
      logout,
    )
  }, [token, logout])

  useEffect(() => {
    let cancelled = false

    async function restore() {
      const stored = readStoredSession()
      if (!stored.token) {
        if (!cancelled) setLoading(false)
        return
      }

      if (!cancelled) {
        setToken(stored.token)
        setUser(stored.user)
      }

      try {
        const response = await fetch(`${API_BASE}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${stored.token}` },
        })

        if (!response.ok) {
          throw new Error("Invalid session")
        }

        const fresh = (await response.json()) as AuthUser
        if (!cancelled) {
          setUser(fresh)
          persistSession(stored.token, fresh)
        }
      } catch {
        if (!cancelled) {
          persistSession(null, null)
          setToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    restore()
    return () => {
      cancelled = true
    }
  }, [])

  const setSession = useCallback((nextToken: string | null, nextUser: AuthUser | null) => {
    persistSession(nextToken, nextUser)
    setToken(nextToken)
    setUser(nextUser)
  }, [])

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    setSession(newToken, newUser)
  }, [setSession])

  const register = useCallback((newToken: string, newUser: AuthUser) => {
    setSession(newToken, newUser)
  }, [setSession])

  const getToken = useCallback(() => {
    if (token) return token
    return localStorage.getItem(TOKEN_KEY)
  }, [token])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setSession, getToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}