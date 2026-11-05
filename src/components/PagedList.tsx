import type { ReactNode } from 'react'
import { PageSpinner } from '@/components/PageSpinner'
import { ErrorState } from '@/components/ErrorState'
import { LoadMore } from '@/components/LoadMore'
import { flattenPages, type PagedQueryResult } from '@/hooks/pagination'
import { getErrorMessage } from '@/lib/errors'

type PagedListProps<T> = {
  query: PagedQueryResult<T>
  /** Рендер уже склеенных страниц. */
  children: (items: T[]) => ReactNode
}

/** Состояния постраничного списка: загрузка, ошибка, данные + «Показать ещё». */
export function PagedList<T>({ query, children }: PagedListProps<T>) {
  if (query.isPending) return <PageSpinner />

  // Ошибка без данных — показывать нечего. Если данные уже есть (упала подгрузка
  // или фоновый перезапрос), список остаётся на экране, а ошибка показывается у кнопки.
  if (query.isError && !query.data) {
    return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />
  }

  return (
    <>
      {children(flattenPages(query.data?.pages))}
      <LoadMore
        hasMore={query.hasNextPage}
        isLoading={query.isFetchingNextPage}
        errorMessage={query.isError ? getErrorMessage(query.error) : null}
        onClick={() => query.fetchNextPage()}
      />
    </>
  )
}
