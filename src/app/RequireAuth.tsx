import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/AuthContext'
import { homePathFor, paths } from '@/app/routes'
import { PageSpinner } from '@/components/PageSpinner'
import type { UserRole } from '@/types/models'

type RequireAuthProps = {
  /** Если задано — пускает только эти роли, остальных отправляет на их главную. */
  allow?: readonly UserRole[]
}

/** Обёртка маршрутов: без сессии — на вход, без нужной роли — на главную роли. */
export function RequireAuth({ allow }: RequireAuthProps) {
  const { profile, isLoading } = useAuth()

  if (isLoading) return <PageSpinner />
  if (!profile) return <Navigate to={paths.login} replace />
  if (allow && !allow.includes(profile.role)) {
    return <Navigate to={homePathFor(profile.role)} replace />
  }
  return <Outlet />
}
