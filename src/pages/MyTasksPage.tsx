import { PageHeader } from '@/components/PageHeader'
import { TaskListSection } from '@/components/TaskListSection'
import { useAuth } from '@/app/AuthContext'
import { useMyTasks } from '@/hooks/useTasks'
import { useTaskStatusFilter } from '@/hooks/useTaskStatusFilter'

export function MyTasksPage() {
  const { profile } = useAuth()
  const [filter, setFilter] = useTaskStatusFilter()
  const tasksQuery = useMyTasks(profile?.id, filter)

  return (
    <>
      <PageHeader title="Мои задачи" description="Задачи, где вы назначены исполнителем" />
      <TaskListSection
        query={tasksQuery}
        filter={filter}
        onFilterChange={setFilter}
        showObject
        emptyMessage="Вам пока не назначили задач"
      />
    </>
  )
}
