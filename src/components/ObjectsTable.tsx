import { memo } from 'react'
import { Link } from 'react-router-dom'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TableCell, TableHead } from '@/components/ui/table'
import { ResponsiveList } from '@/components/ResponsiveList'
import { paths } from '@/app/routes'
import type { ObjectWithTaskCount } from '@/api/objects'

type ObjectsTableProps = {
  objects: ObjectWithTaskCount[]
  /** Показывать кнопки редактирования и удаления. */
  canManage: boolean
  onEdit?: (object: ObjectWithTaskCount) => void
  onDelete?: (object: ObjectWithTaskCount) => void
}

function ObjectsTableView({ objects, canManage, onEdit, onDelete }: ObjectsTableProps) {
  const actions = (object: ObjectWithTaskCount) =>
    canManage && (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="icon" aria-label="Редактировать" onClick={() => onEdit?.(object)}>
          <PencilIcon />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Удалить" onClick={() => onDelete?.(object)}>
          <Trash2Icon />
        </Button>
      </div>
    )

  return (
    <ResponsiveList
      items={objects}
      emptyMessage="Объектов пока нет"
      card={(object) => (
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link to={paths.object(object.id)} className="font-medium hover:underline">
              {object.name}
            </Link>
            <div className="mt-1 text-sm text-muted-foreground">{object.address || '—'}</div>
            <div className="mt-2 text-xs text-muted-foreground">Задач: {object.taskCount}</div>
          </div>
          {actions(object)}
        </div>
      )}
      columns={
        <>
          <TableHead>Название</TableHead>
          <TableHead>Адрес</TableHead>
          <TableHead className="w-24 text-right">Задач</TableHead>
          {canManage && <TableHead className="w-24" />}
        </>
      }
      row={(object) => (
        <>
          <TableCell className="font-medium">
            <Link to={paths.object(object.id)} className="hover:underline">
              {object.name}
            </Link>
          </TableCell>
          <TableCell className="text-muted-foreground">{object.address || '—'}</TableCell>
          <TableCell className="text-right">{object.taskCount}</TableCell>
          {canManage && <TableCell>{actions(object)}</TableCell>}
        </>
      )}
    />
  )
}

/** memo: список не перерисовывается, когда страница меняет только состояние диалогов. */
export const ObjectsTable = memo(ObjectsTableView)
