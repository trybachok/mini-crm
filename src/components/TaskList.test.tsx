import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TaskList } from './TaskList'
import type { TaskWithRelations } from '@/api/tasks'

const task: TaskWithRelations = {
  id: 't1',
  title: 'Залить фундамент',
  description: '',
  object_id: 'o1',
  assignee_id: 'u1',
  author_id: 'm1',
  status: 'in_progress',
  created_at: '2026-11-01T10:00:00Z',
  updated_at: '2026-11-01T10:00:00Z',
  object: { id: 'o1', name: 'ЖК Северный' },
  assignee: { id: 'u1', full_name: 'Иван Петров' },
  author: { id: 'm1', full_name: 'Ольга Смирнова' },
}

const renderList = (props: Partial<React.ComponentProps<typeof TaskList>> = {}) =>
  render(
    <MemoryRouter>
      <TaskList tasks={[task]} {...props} />
    </MemoryRouter>,
  )

describe('TaskList', () => {
  it('показывает задачу со статусом, исполнителем и ссылкой на карточку', () => {
    renderList()
    expect(screen.getAllByRole('link', { name: 'Залить фундамент' })[0]).toHaveAttribute(
      'href',
      '/tasks/t1',
    )
    expect(screen.getAllByText('В работе').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Иван Петров/).length).toBeGreaterThan(0)
  })

  it('показывает объект только при showObject', () => {
    const { rerender } = renderList({ showObject: false })
    expect(screen.queryByText('ЖК Северный')).not.toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <TaskList tasks={[task]} showObject />
      </MemoryRouter>,
    )
    expect(screen.getAllByText('ЖК Северный').length).toBeGreaterThan(0)
  })

  it('пишет «не назначен», если исполнителя нет', () => {
    renderList({ tasks: [{ ...task, assignee_id: null, assignee: null }] })
    expect(screen.getAllByText(/не назначен/).length).toBeGreaterThan(0)
  })

  it('показывает заглушку для пустого списка', () => {
    renderList({ tasks: [], emptyMessage: 'Пусто' })
    expect(screen.getByText('Пусто')).toBeInTheDocument()
  })
})
