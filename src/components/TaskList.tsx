import { memo } from 'react'
import { Link } from 'react-router-dom'
import { TableCell, TableHead } from '@/components/ui/table'
import { StatusBadge } from '@/components/StatusBadge'
import { ResponsiveList } from '@/components/ResponsiveList'
import { paths } from '@/app/routes'
import { formatDate } from '@/lib/format'
import type { TaskListItem } from '@/api/tasks'

type TaskListProps = {
  tasks: TaskListItem[]
  /** Показывать колонку объекта (на экране «Мои задачи»). */
  showObject?: boolean
  emptyMessage?: string
}

const assigneeName = (task: TaskListItem) => task.assignee?.full_name ?? 'не назначен'

function TaskListView({ tasks, showObject = false, emptyMessage = 'Задач пока нет' }: TaskListProps) {
  return (
    <ResponsiveList
      items={tasks}
      emptyMessage={emptyMessage}
      card={(task) => (
        <>
          <div className="flex items-start justify-between gap-2">
            <Link to={paths.task(task.id)} className="font-medium hover:underline">
              {task.title}
            </Link>
            <StatusBadge status={task.status} />
          </div>
          <dl className="mt-2 grid gap-1 text-sm text-muted-foreground">
            {showObject && <dd>{task.object.name}</dd>}
            <dd>Исполнитель: {assigneeName(task)}</dd>
            <dd>Создана: {formatDate(task.created_at)}</dd>
          </dl>
        </>
      )}
      columns={
        <>
          <TableHead>Задача</TableHead>
          {showObject && <TableHead>Объект</TableHead>}
          <TableHead>Исполнитель</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead className="w-28">Создана</TableHead>
        </>
      }
      row={(task) => (
        <>
          <TableCell className="font-medium">
            <Link to={paths.task(task.id)} className="hover:underline">
              {task.title}
            </Link>
          </TableCell>
          {showObject && <TableCell className="text-muted-foreground">{task.object.name}</TableCell>}
          <TableCell className="text-muted-foreground">{assigneeName(task)}</TableCell>
          <TableCell>
            <StatusBadge status={task.status} />
          </TableCell>
          <TableCell className="text-muted-foreground">{formatDate(task.created_at)}</TableCell>
        </>
      )}
    />
  )
}

/** memo: список не перерисовывается, когда страница меняет только состояние диалогов. */
export const TaskList = memo(TaskListView)
