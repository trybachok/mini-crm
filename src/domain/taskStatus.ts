// Статусы задач и правила переходов. Зеркало функции change_task_status в базе:
// база — источник истины, здесь — чтобы показывать только доступные кнопки.

import type { TaskStatus, UserRole } from '@/types/models'

export const taskStatusLabels: Record<TaskStatus, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  on_review: 'На проверке',
  accepted: 'Принята',
  rework: 'На доработке',
}

/** Фильтр списка задач: «активные» (всё, кроме принятых), все или один статус. */
export type TaskStatusFilter = 'active' | 'all' | TaskStatus

export const defaultTaskStatusFilter: TaskStatusFilter = 'active'

export const taskStatusFilterOptions: readonly TaskStatusFilter[] = [
  'active',
  'all',
  'new',
  'in_progress',
  'on_review',
  'rework',
  'accepted',
]

export const taskStatusFilterLabels: Record<TaskStatusFilter, string> = {
  active: 'Активные',
  all: 'Все',
  ...taskStatusLabels,
}

export function isTaskStatusFilter(value: unknown): value is TaskStatusFilter {
  return taskStatusFilterOptions.includes(value as TaskStatusFilter)
}

/** Какие статусы запрашивать у базы; null — без ограничения. */
export function statusesForFilter(filter: TaskStatusFilter): TaskStatus[] | null {
  if (filter === 'all') return null
  if (filter === 'active') return ['new', 'in_progress', 'on_review', 'rework']
  return [filter]
}

export type TaskTransition = {
  to: TaskStatus
  /** Подпись кнопки действия. */
  label: string
  /** Кто может выполнить переход. */
  actor: 'assignee' | 'manager'
  /** Комментарий обязателен. */
  requiresComment: boolean
}

const transitions: Record<TaskStatus, readonly TaskTransition[]> = {
  new: [{ to: 'in_progress', label: 'Взять в работу', actor: 'assignee', requiresComment: false }],
  in_progress: [
    { to: 'on_review', label: 'Отправить на проверку', actor: 'assignee', requiresComment: false },
  ],
  on_review: [
    { to: 'accepted', label: 'Принять', actor: 'manager', requiresComment: false },
    { to: 'rework', label: 'На доработку', actor: 'manager', requiresComment: true },
  ],
  rework: [{ to: 'in_progress', label: 'Взять в работу', actor: 'assignee', requiresComment: false }],
  accepted: [],
}

type Actor = {
  role: UserRole
  /** Текущий пользователь — назначенный исполнитель этой задачи. */
  isAssignee: boolean
}

/** Переходы, доступные пользователю для задачи в данном статусе. */
export function getAvailableTransitions(status: TaskStatus, actor: Actor): TaskTransition[] {
  return transitions[status].filter((transition) =>
    transition.actor === 'manager' ? actor.role === 'manager' : actor.isAssignee,
  )
}
