import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskActions } from './TaskActions'
import type { TaskStatus, UserRole } from '@/types/models'

type Case = {
  status: TaskStatus
  role: UserRole
  isAssignee: boolean
  expected: string[]
}

const cases: Case[] = [
  { status: 'new', role: 'executor', isAssignee: true, expected: ['Взять в работу'] },
  { status: 'new', role: 'executor', isAssignee: false, expected: [] },
  { status: 'new', role: 'manager', isAssignee: false, expected: [] },
  { status: 'in_progress', role: 'executor', isAssignee: true, expected: ['Отправить на проверку'] },
  { status: 'in_progress', role: 'manager', isAssignee: false, expected: [] },
  { status: 'on_review', role: 'executor', isAssignee: true, expected: [] },
  { status: 'on_review', role: 'manager', isAssignee: false, expected: ['Принять', 'На доработку'] },
  { status: 'rework', role: 'executor', isAssignee: true, expected: ['Взять в работу'] },
  { status: 'rework', role: 'manager', isAssignee: false, expected: [] },
  { status: 'accepted', role: 'executor', isAssignee: true, expected: [] },
  { status: 'accepted', role: 'manager', isAssignee: false, expected: [] },
]

describe('TaskActions', () => {
  it.each(cases)('$status / $role / assignee=$isAssignee → $expected', ({ expected, ...actor }) => {
    render(<TaskActions {...actor} onTransition={vi.fn()} />)
    const labels = screen.queryAllByRole('button').map((button) => button.textContent)
    expect(labels).toEqual(expected)
  })

  it('передаёт выбранный переход в onTransition', async () => {
    const onTransition = vi.fn()
    render(<TaskActions status="on_review" role="manager" isAssignee={false} onTransition={onTransition} />)

    await userEvent.click(screen.getByRole('button', { name: 'На доработку' }))

    expect(onTransition).toHaveBeenCalledWith(expect.objectContaining({ to: 'rework', requiresComment: true }))
  })

  it('блокирует кнопки во время запроса', () => {
    render(<TaskActions status="new" role="executor" isAssignee onTransition={vi.fn()} isPending />)
    expect(screen.getByRole('button', { name: 'Взять в работу' })).toBeDisabled()
  })
})
