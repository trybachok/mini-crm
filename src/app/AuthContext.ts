import { createContext, useContext } from 'react'
import type { Profile } from '@/types/models'

export type AuthState = {
  /** Профиль текущего пользователя; null — не авторизован. */
  profile: Profile | null
  /** true, пока не известно, есть ли сессия. */
  isLoading: boolean
}

export const AuthContext = createContext<AuthState>({ profile: null, isLoading: true })

export function useAuth(): AuthState {
  return useContext(AuthContext)
}
