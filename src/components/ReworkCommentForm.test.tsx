import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReworkCommentForm } from './ReworkCommentForm'

describe('ReworkCommentForm', () => {
  it('не отправляет пустой комментарий', async () => {
    const onSubmit = vi.fn()
    render(<ReworkCommentForm onSubmit={onSubmit} onCancel={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'На доработку' }))

    expect(await screen.findByText('Опишите, что нужно доработать')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('отправляет комментарий', async () => {
    const onSubmit = vi.fn()
    render(<ReworkCommentForm onSubmit={onSubmit} onCancel={vi.fn()} />)

    await userEvent.type(screen.getByLabelText('Что нужно доработать'), 'Не хватает фото')
    await userEvent.click(screen.getByRole('button', { name: 'На доработку' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ comment: 'Не хватает фото' }, expect.anything()),
    )
  })
})
