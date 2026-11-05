import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskForm } from './TaskForm'
import type { Profile } from '@/types/models'

const executors: Profile[] = [
  { id: 'u1', full_name: 'Иван Петров', role: 'executor', created_at: '' },
  { id: 'u2', full_name: 'Анна Петрова', role: 'executor', created_at: '' },
]

describe('TaskForm', () => {
  it('требует название задачи', async () => {
    const onSubmit = vi.fn()
    render(<TaskForm executors={executors} onSubmit={onSubmit} onCancel={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(await screen.findByText('Укажите название задачи')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('отправляет задачу без исполнителя с пустым assignee_id', async () => {
    const onSubmit = vi.fn()
    render(<TaskForm executors={executors} onSubmit={onSubmit} onCancel={vi.fn()} />)

    await userEvent.type(screen.getByLabelText('Название'), 'Проверить кровлю')
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { title: 'Проверить кровлю', description: '', assignee_id: '' },
        expect.anything(),
      ),
    )
  })

  it('показывает выбранного исполнителя при редактировании', () => {
    render(
      <TaskForm
        executors={executors}
        defaultValues={{ title: 'Задача', description: 'Описание', assignee_id: 'u2' }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Название')).toHaveValue('Задача')
    expect(screen.getByRole('combobox', { name: 'Исполнитель' })).toHaveTextContent('Анна Петрова')
  })
})
