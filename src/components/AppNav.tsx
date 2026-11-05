import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { paths } from '@/app/routes'
import type { UserRole } from '@/types/models'

type NavItem = { to: string; label: string; roles: readonly UserRole[] }

const navItems: readonly NavItem[] = [
  { to: paths.myTasks, label: 'Мои задачи', roles: ['executor'] },
  { to: paths.objects, label: 'Объекты', roles: ['manager', 'executor'] },
]

type AppNavProps = {
  role: UserRole
  /** Вертикальный вариант для мобильного меню. */
  vertical?: boolean
  onNavigate?: () => void
}

export function AppNav({ role, vertical = false, onNavigate }: AppNavProps) {
  const items = navItems.filter((item) => item.roles.includes(role))

  return (
    <nav className={cn('flex gap-1', vertical ? 'flex-col' : 'flex-row items-center')}>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted',
              isActive ? 'bg-muted text-foreground' : 'text-muted-foreground',
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
