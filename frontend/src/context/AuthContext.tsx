import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/services/api'
import { getProfile, login, register, updateProfile } from '@/services/auth'
import { decodeJwtPayload } from '@/lib/jwt'
import type { AuthSession, User } from '@/types/models'
import type { LoginValues, RegisterValues } from '@/validation/auth'

type AuthContextValue = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (values: LoginValues) => Promise<AuthSession>
  register: (values: RegisterValues) => Promise<AuthSession>
  logout: () => void
  refreshUser: () => Promise<void>
  updateCurrentUser: (payload: Partial<Pick<User, 'name' | 'avatar'>>) => Promise<User>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function loadStoredUser() {
  const stored = localStorage.getItem(AUTH_USER_KEY)

  if (!stored) {
    return null
  }

  try {
    return JSON.parse(stored) as User
  } catch {
    return null
  }
}

function persistAuth(session: AuthSession) {
  localStorage.setItem(AUTH_TOKEN_KEY, session.token)
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY))
  const [user, setUser] = useState<User | null>(() => loadStoredUser())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setUser(null)
        setIsLoading(false)
        return
      }

      if (user) {
        setIsLoading(false)
        return
      }

      const payload = decodeJwtPayload<{ id?: number }>(token)

      if (!payload?.id) {
        logout()
        setIsLoading(false)
        return
      }

      try {
        const profile = await getProfile(payload.id)
        setUser(profile)
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(profile))
      } catch {
        logout()
      } finally {
        setIsLoading(false)
      }
    }

    void bootstrap()
  }, [token])

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
    setToken(null)
    setUser(null)
  }

  const handleLogin = async (values: LoginValues) => {
    const session = await login(values)
    persistAuth(session)
    setToken(session.token)
    setUser(session.user)
    return session
  }

  const handleRegister = async (values: RegisterValues) => {
    const session = await register(values)
    persistAuth(session)
    setToken(session.token)
    setUser(session.user)
    return session
  }

  const refreshUser = async () => {
    if (!token) {
      return
    }

    const payload = decodeJwtPayload<{ id?: number }>(token)

    if (!payload?.id) {
      return
    }

    const profile = await getProfile(payload.id)
    setUser(profile)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(profile))
  }

  const updateCurrentUser = async (payload: Partial<Pick<User, 'name' | 'avatar'>>) => {
    if (!user) {
      throw new Error('User is not authenticated.')
    }

    const updatedUser = await updateProfile(user.id, payload)
    setUser(updatedUser)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser))
    return updatedUser
  }

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login: handleLogin,
      register: handleRegister,
      logout,
      refreshUser,
      updateCurrentUser,
    }),
    [token, user, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
