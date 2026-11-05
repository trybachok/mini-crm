import { render, screen } from '@testing-library/react'
import { TaskStatusFilter } from './TaskStatusFilter'

describe('TaskStatusFilter', () => {
  it('показывает подпись выбранного фильтра', () => {
    const { rerender } = render(<TaskStatusFilter value="active" onChange={vi.fn()} />)
    expect(screen.getByRole('combobox', { name: 'Статус' })).toHaveTextContent('Активные')

    rerender(<TaskStatusFilter value="on_review" onChange={vi.fn()} />)
    expect(screen.getByRole('combobox', { name: 'Статус' })).toHaveTextContent('На проверке')
  })
})
