import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './LoginForm'

describe('LoginForm', () => {
  it('не отправляет форму с пустыми полями и показывает ошибки', async () => {
    const onSubmit = vi.fn()
    render(<LoginForm onSubmit={onSubmit} />)

    await userEvent.click(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByText('Введите корректный email')).toBeInTheDocument()
    expect(screen.getByText('Пароль не короче 6 символов')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('передаёт введённые данные в onSubmit', async () => {
    const onSubmit = vi.fn()
    render(<LoginForm onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Email'), 'manager@example.com')
    await userEvent.type(screen.getByLabelText('Пароль'), 'manager123')
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { email: 'manager@example.com', password: 'manager123' },
        expect.anything(),
      ),
    )
  })

  it('показывает сообщение об ошибке входа', () => {
    render(<LoginForm onSubmit={vi.fn()} errorMessage="Неверный email или пароль" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Неверный email или пароль')
  })
})
