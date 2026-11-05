import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ObjectForm } from './ObjectForm'

describe('ObjectForm', () => {
  it('требует название', async () => {
    const onSubmit = vi.fn()
    render(<ObjectForm onSubmit={onSubmit} onCancel={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(await screen.findByText('Укажите название объекта')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('отправляет значения, обрезая пробелы', async () => {
    const onSubmit = vi.fn()
    render(<ObjectForm onSubmit={onSubmit} onCancel={vi.fn()} />)

    await userEvent.type(screen.getByLabelText('Название'), '  Школа ')
    await userEvent.type(screen.getByLabelText('Адрес'), 'ул. Строителей, 7')
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { name: 'Школа', address: 'ул. Строителей, 7' },
        expect.anything(),
      ),
    )
  })

  it('подставляет значения при редактировании и вызывает onCancel', async () => {
    const onCancel = vi.fn()
    render(
      <ObjectForm
        defaultValues={{ name: 'Склад', address: 'Домодедово' }}
        onSubmit={vi.fn()}
        onCancel={onCancel}
      />,
    )

    expect(screen.getByLabelText('Название')).toHaveValue('Склад')
    await userEvent.click(screen.getByRole('button', { name: 'Отмена' }))
    expect(onCancel).toHaveBeenCalled()
  })
})
