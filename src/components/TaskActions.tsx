import { Button } from '@/components/ui/button'
import { getAvailableTransitions, type TaskTransition } from '@/domain/taskStatus'
import type { TaskStatus, UserRole } from '@/types/models'

type TaskActionsProps = {
  status: TaskStatus
  role: UserRole
  isAssignee: boolean
  onTransition: (transition: TaskTransition) => void
  isPending?: boolean
}

/** Кнопки смены статуса. Показывает только переходы, доступные текущему пользователю. */
export function TaskActions({ status, role, isAssignee, onTransition, isPending }: TaskActionsProps) {
  const transitions = getAvailableTransitions(status, { role, isAssignee })
  if (transitions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {transitions.map((transition) => (
        <Button
          key={transition.to}
          variant={transition.to === 'rework' ? 'outline' : 'default'}
          disabled={isPending}
          onClick={() => onTransition(transition)}
        >
          {transition.label}
        </Button>
      ))}
    </div>
  )
}
