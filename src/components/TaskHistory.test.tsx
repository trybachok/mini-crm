import { render, screen } from '@testing-library/react'
import { TaskHistory } from './TaskHistory'
import type { TaskHistoryWithAuthor } from '@/api/history'

const entry = (overrides: Partial<TaskHistoryWithAuthor>): TaskHistoryWithAuthor => ({
  id: 'h1',
  task_id: 't1',
  changed_by: 'u1',
  from_status: null,
  to_status: 'new',
  comment: null,
  created_at: '2026-11-01T10:00:00Z',
  changed_by_profile: { full_name: 'Ольга Смирнова' },
  ...overrides,
})

describe('TaskHistory', () => {
  it('показывает создание, переходы и комментарий', () => {
    render(
      <TaskHistory
        entries={[
          entry({ id: 'h1' }),
          entry({ id: 'h2', from_status: 'on_review', to_status: 'rework', comment: 'Переделать стык' }),
        ]}
      />,
    )

    expect(screen.getByText('Создана')).toBeInTheDocument()
    expect(screen.getByText('На проверке')).toBeInTheDocument()
    expect(screen.getByText('На доработке')).toBeInTheDocument()
    expect(screen.getByText('Переделать стык')).toBeInTheDocument()
    expect(screen.getAllByText(/Ольга Смирнова/)).toHaveLength(2)
  })

  it('показывает заглушку для пустой истории', () => {
    render(<TaskHistory entries={[]} />)
    expect(screen.getByText('История пуста')).toBeInTheDocument()
  })
})
