import { Link } from 'react-router-dom'
import { StatusBadge } from '@/components/StatusBadge'
import { paths } from '@/app/routes'
import { formatDateTime } from '@/lib/format'
import type { TaskWithRelations } from '@/api/tasks'

/** Описание задачи и её реквизиты. Только отображение, без действий. */
export function TaskDetails({ task }: { task: TaskWithRelations }) {
  return (
    <div className="grid gap-4">
      <div>
        <StatusBadge status={task.status} />
      </div>

      <p className="text-sm whitespace-pre-wrap">
        {task.description || <span className="text-muted-foreground">Описания нет</span>}
      </p>

      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Объект</dt>
          <dd>
            <Link to={paths.object(task.object.id)} className="hover:underline">
              {task.object.name}
            </Link>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Исполнитель</dt>
          <dd>{task.assignee?.full_name ?? 'не назначен'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Постановщик</dt>
          <dd>{task.author.full_name}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Создана</dt>
          <dd>{formatDateTime(task.created_at)}</dd>
        </div>
        {task.updated_at !== task.created_at && (
          <div>
            <dt className="text-muted-foreground">Обновлена</dt>
            <dd>{formatDateTime(task.updated_at)}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}
