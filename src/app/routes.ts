import type { UserRole } from '@/types/models'

export const paths = {
  login: '/login',
  objects: '/objects',
  object: (id: string) => `/objects/${id}`,
  task: (id: string) => `/tasks/${id}`,
  myTasks: '/my-tasks',
} as const

/** Куда попадает пользователь после входа. */
export function homePathFor(role: UserRole): string {
  return role === 'executor' ? paths.myTasks : paths.objects
}
