import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { taskStatusLabels } from '@/domain/taskStatus'
import type { TaskStatus } from '@/types/models'

const statusClassNames: Record<TaskStatus, string> = {
  new: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-800',
  on_review: 'bg-amber-100 text-amber-800',
  rework: 'bg-rose-100 text-rose-800',
  accepted: 'bg-emerald-100 text-emerald-800',
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge variant="secondary" className={cn('whitespace-nowrap', statusClassNames[status])}>
      {taskStatusLabels[status]}
    </Badge>
  )
}
