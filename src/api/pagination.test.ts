import { PAGE_SIZE, paged, toPage } from './pagination'

/** Запрос-заглушка: записывает вызовы вместо похода в PostgREST. */
function fakeQuery() {
  const calls: unknown[][] = []
  const record =
    (name: string) =>
    (...args: unknown[]) => (calls.push([name, ...args]), query)
  const query = { calls, order: record('order'), lte: record('lte'), or: record('or'), limit: record('limit') }
  return query
}

const row = (n: number) => ({ id: `id-${n}`, created_at: `2026-11-0${(n % 9) + 1}T00:00:00+00:00` })

describe('pagination', () => {
  it('первая страница: сортировка created_at desc, id и на одну строку больше размера страницы', () => {
    expect(paged(fakeQuery(), null).calls).toEqual([
      ['order', 'created_at', { ascending: false }],
      ['order', 'id'],
      ['limit', PAGE_SIZE + 1],
    ])
  })

  it('следующая страница: keyset-условие строго после курсора', () => {
    const cursor = { created_at: '2026-11-05T09:00:00+00:00', id: 'abc' }
    expect(paged(fakeQuery(), cursor).calls.slice(2)).toEqual([
      ['lte', 'created_at', cursor.created_at],
      ['or', `created_at.lt.${cursor.created_at},id.gt.abc`],
      ['limit', PAGE_SIZE + 1],
    ])
  })

  it('лишняя строка означает, что есть следующая страница; курсор — последняя показанная строка', () => {
    const rows = Array.from({ length: PAGE_SIZE + 1 }, (_, i) => row(i))
    const page = toPage(rows)
    expect(page.items).toHaveLength(PAGE_SIZE)
    expect(page.nextCursor).toEqual({ created_at: rows[PAGE_SIZE - 1].created_at, id: rows[PAGE_SIZE - 1].id })
  })

  it('неполная страница — последняя', () => {
    expect(toPage([row(1), row(2)])).toEqual({ items: [row(1), row(2)], nextCursor: null })
    expect(toPage([])).toEqual({ items: [], nextCursor: null })
  })
})
