import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { guardedSignIn } from '../services/loginGuard'

export { lockRemainingSec } from '../services/loginGuard'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, session: null })

  const refresh = useCallback(async () => {
    try {
      const session = await api.auth.getSession()
      setState({ loading: false, session })
    } catch {
      setState({ loading: false, session: null })
    }
  }, [])

  useEffect(() => {
    refresh()
    const unsub = api.auth.onChange(refresh)
    // ตรวจ session หมดอายุทุกนาที
    const id = setInterval(refresh, 60000)
    return () => {
      unsub?.()
      clearInterval(id)
    }
  }, [refresh])

  const login = useCallback(async (credentials) => {
    const session = await guardedSignIn(credentials)
    setState({ loading: false, session })
    return session
  }, [])

  const logout = useCallback(async () => {
    await api.auth.signOut()
    setState({ loading: false, session: null })
  }, [])

  const value = useMemo(
    () => ({
      loading: state.loading,
      isAdmin: !!state.session,
      user: state.session?.user || null,
      mode: api.auth.mode,
      login,
      logout,
    }),
    [state, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
