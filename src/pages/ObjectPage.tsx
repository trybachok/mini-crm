import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeftIcon, PencilIcon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/PageHeader'
import { PageSpinner } from '@/components/PageSpinner'
import { NotFound } from '@/components/NotFound'
import { TaskListSection } from '@/components/TaskListSection'
import { TaskForm } from '@/components/TaskForm'
import { ObjectForm } from '@/components/ObjectForm'
import { FormDialog } from '@/components/FormDialog'
import { useAuth } from '@/app/AuthContext'
import { paths } from '@/app/routes'
import { useObject, useSaveObject } from '@/hooks/useObjects'
import { useExecutors, useSaveTask, useTasksByObject } from '@/hooks/useTasks'
import { useTaskStatusFilter } from '@/hooks/useTaskStatusFilter'
import type { ObjectValues, TaskValues } from '@/domain/schemas'

export function ObjectPage() {
  const { objectId = '' } = useParams()
  const { profile } = useAuth()
  const isManager = profile?.role === 'manager'

  const [filter, setFilter] = useTaskStatusFilter()
  const objectQuery = useObject(objectId)
  const tasksQuery = useTasksByObject(objectId, filter)
  const executorsQuery = useExecutors(isManager)
  const saveTask = useSaveTask(objectId)
  const saveObject = useSaveObject()
  const [dialog, setDialog] = useState<'closed' | 'task' | 'edit'>('closed')
  const closeDialog = () => setDialog('closed')

  async function handleCreateTask(values: TaskValues) {
    await saveTask.mutateAsync({ values })
    closeDialog()
  }

  async function handleSaveObject(values: ObjectValues) {
    await saveObject.mutateAsync({ objectId, values })
    closeDialog()
  }

  if (objectQuery.isPending) return <PageSpinner />
  if (objectQuery.isError || !objectQuery.data) {
    return <NotFound message="Объект не найден или у вас нет к нему доступа" backTo={paths.objects} backLabel="К списку объектов" />
  }

  const object = objectQuery.data

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
        <Link to={paths.objects}>
          <ArrowLeftIcon /> Объекты
        </Link>
      </Button>

      <PageHeader
        title={object.name}
        description={object.address || 'Адрес не указан'}
        actions={
          isManager && (
            <>
              <Button variant="outline" onClick={() => setDialog('edit')}>
                <PencilIcon /> Редактировать
              </Button>
              <Button onClick={() => setDialog('task')}>
                <PlusIcon /> Новая задача
              </Button>
            </>
          )
        }
      />

      <TaskListSection
        query={tasksQuery}
        filter={filter}
        onFilterChange={setFilter}
        emptyMessage={isManager ? 'Задач по объекту пока нет' : 'У вас нет задач по этому объекту'}
      />

      {isManager && (
        <>
          <FormDialog open={dialog === 'task'} onOpenChange={(open) => !open && closeDialog()} title="Новая задача">
            <TaskForm
              executors={executorsQuery.data ?? []}
              onSubmit={handleCreateTask}
              onCancel={closeDialog}
              isSubmitting={saveTask.isPending}
            />
          </FormDialog>
          <FormDialog open={dialog === 'edit'} onOpenChange={(open) => !open && closeDialog()} title="Редактировать объект">
            <ObjectForm
              defaultValues={{ name: object.name, address: object.address }}
              onSubmit={handleSaveObject}
              onCancel={closeDialog}
              isSubmitting={saveObject.isPending}
            />
          </FormDialog>
        </>
      )}
    </>
  )
}
