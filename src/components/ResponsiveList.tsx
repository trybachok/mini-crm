import type { ReactNode } from 'react'
import { Table, TableBody, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/EmptyState'

type ResponsiveListProps<T extends { id: string }> = {
  items: T[]
  emptyMessage: string
  /** Содержимое карточки на телефоне. */
  card: (item: T) => ReactNode
  /** Ячейки заголовка таблицы (`<TableHead>`). */
  columns: ReactNode
  /** Ячейки строки таблицы (`<TableCell>`). */
  row: (item: T) => ReactNode
}

/** Телефон — карточки, планшет и шире — таблица. Один источник данных, две раскладки. */
export function ResponsiveList<T extends { id: string }>({
  items,
  emptyMessage,
  card,
  columns,
  row,
}: ResponsiveListProps<T>) {
  if (items.length === 0) return <EmptyState message={emptyMessage} />

  return (
    <>
      <ul className="grid gap-3 md:hidden">
        {items.map((item) => (
          <li key={item.id} className="rounded-lg border bg-background p-4">
            {card(item)}
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-lg border bg-background md:block">
        <Table>
          <TableHeader>
            <TableRow>{columns}</TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>{row(item)}</TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
