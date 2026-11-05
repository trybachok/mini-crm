import { PagedList } from '@/components/PagedList'
import { TaskList } from '@/components/TaskList'
import { TaskStatusFilter } from '@/components/TaskStatusFilter'
import type { PagedQueryResult } from '@/hooks/pagination'
import type { TaskStatusFilter as Filter } from '@/domain/taskStatus'
import type { TaskListItem } from '@/api/tasks'

type TaskListSectionProps = {
  query: PagedQueryResult<TaskListItem>
  filter: Filter
  onFilterChange: (filter: Filter) => void
  showObject?: boolean
  /** Сообщение, когда задач нет вообще (фильтр «Активные» или «Все»). */
  emptyMessage: string
}

/** Фильтр по статусу + список задач + «Показать ещё». Общий блок для карточки объекта и «Моих задач». */
export function TaskListSection({ query, filter, onFilterChange, showObject, emptyMessage }: TaskListSectionProps) {
  // Конкретный статус выбран явно — пустой результат объясняем фильтром, а не отсутствием задач.
  const isStatusSelected = filter !== 'active' && filter !== 'all'

  return (
    <>
      <div className="mb-3 flex justify-end">
        <TaskStatusFilter value={filter} onChange={onFilterChange} />
      </div>
      <PagedList query={query}>
        {(tasks) => (
          <TaskList
            tasks={tasks}
            showObject={showObject}
            emptyMessage={isStatusSelected ? 'Нет задач с таким статусом' : emptyMessage}
          />
        )}
      </PagedList>
    </>
  )
}
