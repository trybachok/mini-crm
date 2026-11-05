/** Размер страницы для списков. PostgREST сам обрезает ответ на 1000 строках, поэтому грузим порциями. */
export const PAGE_SIZE = 50

/** Позиция последней показанной строки: списки сортируются по (created_at desc, id). */
export type Cursor = { created_at: string; id: string }

export type Page<T> = { items: T[]; nextCursor: Cursor | null }

/** Минимум от PostgREST-запроса, который нужен для постраничной выборки. */
type Pageable<Q> = {
  order(column: 'created_at' | 'id', options?: { ascending?: boolean }): Q
  lte(column: 'created_at', value: string): Q
  or(filters: string): Q
  limit(count: number): Q
}

/**
 * Keyset-пагинация: вместо OFFSET запрашиваем строки строго после курсора.
 * Стоимость страницы не зависит от её номера, индекс (…, created_at desc, id)
 * отдаёт строки уже в нужном порядке. Запрашиваем на одну больше, чтобы узнать,
 * есть ли следующая страница.
 */
export function paged<Q extends Pageable<Q>>(query: Q, cursor: Cursor | null): Q {
  let page = query.order('created_at', { ascending: false }).order('id')
  if (cursor) {
    // lte задаёт планировщику границу по индексу; or отсекает из «хвоста» с тем же
    // created_at строки, которые уже показаны (id меньше либо равен курсору).
    page = page
      .lte('created_at', cursor.created_at)
      .or(`created_at.lt.${cursor.created_at},id.gt.${cursor.id}`)
  }
  return page.limit(PAGE_SIZE + 1)
}

export function toPage<T extends Cursor>(rows: T[]): Page<T> {
  const items = rows.slice(0, PAGE_SIZE)
  const last = items.at(-1)
  const hasMore = rows.length > PAGE_SIZE && last !== undefined
  return { items, nextCursor: hasMore ? { created_at: last.created_at, id: last.id } : null }
}
