import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ObjectsTable } from './ObjectsTable'
import type { ObjectWithTaskCount } from '@/api/objects'

const objects: ObjectWithTaskCount[] = [
  { id: 'o1', name: 'ЖК Северный', address: 'ул. Полярная, 12', created_at: '', updated_at: '', taskCount: 3 },
  { id: 'o2', name: 'Склад', address: '', created_at: '', updated_at: '', taskCount: 0 },
]

const renderTable = (props: Partial<React.ComponentProps<typeof ObjectsTable>> = {}) =>
  render(
    <MemoryRouter>
      <ObjectsTable objects={objects} canManage={false} {...props} />
    </MemoryRouter>,
  )

describe('ObjectsTable', () => {
  it('показывает объекты со ссылками на карточку', () => {
    renderTable()
    // Название встречается дважды: в мобильной карточке и в строке таблицы.
    const links = screen.getAllByRole('link', { name: 'ЖК Северный' })
    expect(links.length).toBeGreaterThan(0)
    expect(links[0]).toHaveAttribute('href', '/objects/o1')
  })

  it('без прав управления не показывает кнопки действий', () => {
    renderTable({ canManage: false })
    expect(screen.queryByRole('button', { name: 'Удалить' })).not.toBeInTheDocument()
  })

  it('с правами управления вызывает onEdit и onDelete', async () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    renderTable({ canManage: true, onEdit, onDelete })

    await userEvent.click(screen.getAllByRole('button', { name: 'Редактировать' })[0])
    await userEvent.click(screen.getAllByRole('button', { name: 'Удалить' })[0])

    expect(onEdit).toHaveBeenCalledWith(objects[0])
    expect(onDelete).toHaveBeenCalledWith(objects[0])
  })

  it('показывает заглушку, если объектов нет', () => {
    renderTable({ objects: [] })
    expect(screen.getByText('Объектов пока нет')).toBeInTheDocument()
  })
})
