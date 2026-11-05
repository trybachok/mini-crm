import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PagedList } from './PagedList'
import type { PagedQueryResult } from '@/hooks/pagination'

/** Минимальный слепок результата useInfiniteQuery для нужного состояния. */
function queryState(overrides: Partial<PagedQueryResult<number>>) {
  return {
    isPending: false,
    isError: false,
    isFetchNextPageError: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    error: null,
    data: { pages: [{ items: [1, 2], nextCursor: null }], pageParams: [null] },
    refetch: vi.fn(),
    fetchNextPage: vi.fn(),
    ...overrides,
  } as unknown as PagedQueryResult<number>
}

const renderItems = (items: number[]) => <div data-testid="items">{items.join(',')}</div>

describe('PagedList', () => {
  it('показывает спиннер, пока грузится первая страница', () => {
    render(<PagedList query={queryState({ isPending: true, data: undefined })}>{renderItems}</PagedList>)
    expect(screen.getByRole('status', { name: 'Загрузка' })).toBeInTheDocument()
  })

  it('при ошибке первой страницы показывает сообщение и кнопку повтора', async () => {
    const refetch = vi.fn()
    render(
      <PagedList query={queryState({ isError: true, error: new Error('Нет связи'), data: undefined, refetch })}>
        {renderItems}
      </PagedList>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Нет связи')
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('склеивает страницы и подгружает следующую', async () => {
    const fetchNextPage = vi.fn()
    render(
      <PagedList
        query={queryState({
          hasNextPage: true,
          fetchNextPage,
          data: { pages: [{ items: [1, 2], nextCursor: { created_at: 'c', id: '2' } }, { items: [3], nextCursor: { created_at: 'c', id: '3' } }], pageParams: [null, { created_at: 'c', id: '2' }] },
        })}
      >
        {renderItems}
      </PagedList>,
    )
    expect(screen.getByTestId('items')).toHaveTextContent('1,2,3')
    await userEvent.click(screen.getByRole('button', { name: 'Показать ещё' }))
    expect(fetchNextPage).toHaveBeenCalledOnce()
  })

  it('при ошибке подгрузки сохраняет уже загруженные данные', () => {
    render(
      <PagedList
        query={queryState({ hasNextPage: true, isError: true, isFetchNextPageError: true, error: new Error('Таймаут') })}
      >
        {renderItems}
      </PagedList>,
    )
    expect(screen.getByTestId('items')).toHaveTextContent('1,2')
    expect(screen.getByRole('alert')).toHaveTextContent('Таймаут')
  })
})
