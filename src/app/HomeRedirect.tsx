import { Navigate } from 'react-router-dom'
import { useAuth } from '@/app/AuthContext'
import { homePathFor, paths } from '@/app/routes'

/** Корень сайта: отправляет на главную страницу роли. */
export function HomeRedirect() {
  const { profile } = useAuth()
  return <Navigate to={profile ? homePathFor(profile.role) : paths.login} replace />
}
