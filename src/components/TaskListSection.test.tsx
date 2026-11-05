import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TaskListSection } from './TaskListSection'
import type { PagedQueryResult } from '@/hooks/pagination'
import type { TaskListItem } from '@/api/tasks'
import type { TaskStatusFilter } from '@/domain/taskStatus'

const emptyQuery = {
  isPending: false,
  isError: false,
  isFetchNextPageError: false,
  isFetchingNextPage: false,
  hasNextPage: false,
  error: null,
  data: { pages: [{ items: [], nextCursor: null }], pageParams: [null] },
  refetch: vi.fn(),
  fetchNextPage: vi.fn(),
} as unknown as PagedQueryResult<TaskListItem>

const renderSection = (filter: TaskStatusFilter) =>
  render(
    <MemoryRouter>
      <TaskListSection query={emptyQuery} filter={filter} onFilterChange={vi.fn()} emptyMessage="Задач по объекту пока нет" />
    </MemoryRouter>,
  )

describe('TaskListSection', () => {
  it('без задач при фильтрах «Активные» и «Все» показывает сообщение страницы', () => {
    const { unmount } = renderSection('active')
    expect(screen.getByText('Задач по объекту пока нет')).toBeInTheDocument()
    unmount()

    renderSection('all')
    expect(screen.getByText('Задач по объекту пока нет')).toBeInTheDocument()
  })

  it('без задач при явно выбранном статусе объясняет пустоту фильтром', () => {
    renderSection('rework')
    expect(screen.getByText('Нет задач с таким статусом')).toBeInTheDocument()
  })
})
