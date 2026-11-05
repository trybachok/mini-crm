import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoadMore } from './LoadMore'

describe('LoadMore', () => {
  it('не рендерится, когда страниц больше нет', () => {
    const { container } = render(<LoadMore hasMore={false} isLoading={false} onClick={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('вызывает onClick и блокируется во время загрузки', async () => {
    const onClick = vi.fn()
    const { rerender } = render(<LoadMore hasMore isLoading={false} onClick={onClick} />)

    await userEvent.click(screen.getByRole('button', { name: 'Показать ещё' }))
    expect(onClick).toHaveBeenCalledOnce()

    rerender(<LoadMore hasMore isLoading onClick={onClick} />)
    expect(screen.getByRole('button', { name: 'Загрузка…' })).toBeDisabled()
  })

  it('показывает ошибку подгрузки и предлагает повторить', () => {
    render(<LoadMore hasMore isLoading={false} errorMessage="Сеть недоступна" onClick={vi.fn()} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Сеть недоступна')
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeEnabled()
  })
})
