import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query'
import type { Cursor, Page } from '@/api/pagination'

/** Постраничный список: следующая страница запрашивается по курсору, пока сервер его возвращает. */
export function usePagedQuery<T>(
  queryKey: QueryKey,
  fetchPage: (cursor: Cursor | null) => Promise<Page<T>>,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: null as Cursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  })
}

export type PagedQueryResult<T> = ReturnType<typeof usePagedQuery<T>>

/** Склеивает загруженные страницы в один список. */
export function flattenPages<T>(pages: Page<T>[] | undefined): T[] {
  return pages?.flatMap((page) => page.items) ?? []
}
