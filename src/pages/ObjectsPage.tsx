import { useCallback, useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/PageHeader'
import { PagedList } from '@/components/PagedList'
import { ObjectsTable } from '@/components/ObjectsTable'
import { ObjectForm } from '@/components/ObjectForm'
import { FormDialog } from '@/components/FormDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useAuth } from '@/app/AuthContext'
import { useDeleteObject, useObjects, useSaveObject } from '@/hooks/useObjects'
import type { ObjectWithTaskCount } from '@/api/objects'
import type { ObjectValues } from '@/domain/schemas'

type DialogState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; object: ObjectWithTaskCount }
  | { kind: 'delete'; object: ObjectWithTaskCount }

export function ObjectsPage() {
  const { profile } = useAuth()
  const isManager = profile?.role === 'manager'
  const objectsQuery = useObjects()
  const saveObject = useSaveObject()
  const deleteObject = useDeleteObject()
  const [dialog, setDialog] = useState<DialogState>({ kind: 'closed' })

  const closeDialog = () => setDialog({ kind: 'closed' })
  // Стабильные колбэки, чтобы memo на ObjectsTable работал при открытии диалогов.
  const openEdit = useCallback((object: ObjectWithTaskCount) => setDialog({ kind: 'edit', object }), [])
  const openDelete = useCallback((object: ObjectWithTaskCount) => setDialog({ kind: 'delete', object }), [])

  async function handleSave(values: ObjectValues) {
    const objectId = dialog.kind === 'edit' ? dialog.object.id : undefined
    await saveObject.mutateAsync({ objectId, values })
    closeDialog()
  }

  async function handleDelete() {
    if (dialog.kind !== 'delete') return
    await deleteObject.mutateAsync(dialog.object.id)
    closeDialog()
  }

  return (
    <>
      <PageHeader
        title="Объекты"
        description={isManager ? 'Стройки, по которым ставятся задачи' : 'Объекты, где у вас есть задачи'}
        actions={
          isManager && (
            <Button onClick={() => setDialog({ kind: 'create' })}>
              <PlusIcon /> Добавить объект
            </Button>
          )
        }
      />

      <PagedList query={objectsQuery}>
        {(objects) => (
          <ObjectsTable objects={objects} canManage={isManager} onEdit={openEdit} onDelete={openDelete} />
        )}
      </PagedList>

      <FormDialog
        open={dialog.kind === 'create' || dialog.kind === 'edit'}
        onOpenChange={(open) => !open && closeDialog()}
        title={dialog.kind === 'edit' ? 'Редактировать объект' : 'Новый объект'}
      >
        <ObjectForm
          defaultValues={
            dialog.kind === 'edit'
              ? { name: dialog.object.name, address: dialog.object.address }
              : undefined
          }
          onSubmit={handleSave}
          onCancel={closeDialog}
          isSubmitting={saveObject.isPending}
        />
      </FormDialog>

      <ConfirmDialog
        open={dialog.kind === 'delete'}
        onOpenChange={(open) => !open && closeDialog()}
        title="Удалить объект?"
        description={
          dialog.kind === 'delete' &&
          `«${dialog.object.name}» и все его задачи (${dialog.object.taskCount}) будут удалены безвозвратно.`
        }
        onConfirm={handleDelete}
        isPending={deleteObject.isPending}
      />
    </>
  )
}
