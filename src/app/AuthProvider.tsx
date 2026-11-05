import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fetchProfile } from '@/api/auth'
import { AuthContext } from '@/app/AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  // undefined — сессия ещё не проверена; null — не авторизован.
  const [userId, setUserId] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null)
      if (!session) queryClient.clear()
    })
    return () => subscription.subscription.unsubscribe()
  }, [queryClient])

  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId!),
    enabled: Boolean(userId),
    staleTime: Infinity,
  })

  const isLoading = userId === undefined || (Boolean(userId) && profileQuery.isPending)
  const profile = profileQuery.data ?? null

  // Стабильная ссылка: иначе каждый рендер провайдера перерисовывал бы всех потребителей контекста.
  const value = useMemo(() => ({ profile, isLoading }), [profile, isLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
