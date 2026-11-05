import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/PageHeader'
import { PageSpinner } from '@/components/PageSpinner'
import { NotFound } from '@/components/NotFound'
import { TaskDetails } from '@/components/TaskDetails'
import { TaskActions } from '@/components/TaskActions'
import { TaskHistory } from '@/components/TaskHistory'
import { TaskForm } from '@/components/TaskForm'
import { ReworkCommentForm } from '@/components/ReworkCommentForm'
import { FormDialog } from '@/components/FormDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useAuth } from '@/app/AuthContext'
import { paths } from '@/app/routes'
import {
  useChangeTaskStatus,
  useDeleteTask,
  useExecutors,
  useSaveTask,
  useTask,
  useTaskHistory,
} from '@/hooks/useTasks'
import type { TaskTransition } from '@/domain/taskStatus'
import type { ReworkCommentValues, TaskValues } from '@/domain/schemas'

type DialogState = 'closed' | 'edit' | 'delete' | 'rework'

export function TaskPage() {
  const { taskId = '' } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const role = profile?.role ?? 'executor'
  const isManager = role === 'manager'

  const taskQuery = useTask(taskId)
  const historyQuery = useTaskHistory(taskId)
  const executorsQuery = useExecutors(isManager)
  const saveTask = useSaveTask(taskQuery.data?.object_id ?? '')
  const deleteTask = useDeleteTask()
  const changeStatus = useChangeTaskStatus(taskId)
  const [dialog, setDialog] = useState<DialogState>('closed')

  const closeDialog = () => setDialog('closed')

  function handleTransition(transition: TaskTransition) {
    if (transition.requiresComment) setDialog('rework')
    else changeStatus.mutate({ newStatus: transition.to })
  }

  async function handleRework({ comment }: ReworkCommentValues) {
    await changeStatus.mutateAsync({ newStatus: 'rework', comment })
    closeDialog()
  }

  async function handleSave(values: TaskValues) {
    await saveTask.mutateAsync({ taskId, values })
    closeDialog()
  }

  async function handleDelete() {
    const objectId = taskQuery.data?.object_id
    await deleteTask.mutateAsync(taskId)
    navigate(objectId ? paths.object(objectId) : paths.objects, { replace: true })
  }

  if (taskQuery.isPending) return <PageSpinner />
  if (taskQuery.isError || !taskQuery.data) {
    return (
      <NotFound
        message="Задача не найдена или у вас нет к ней доступа"
        backTo={isManager ? paths.objects : paths.myTasks}
        backLabel={isManager ? 'К списку объектов' : 'К моим задачам'}
      />
    )
  }

  const task = taskQuery.data
  const isAssignee = task.assignee_id === profile?.id

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
        {isManager ? (
          <Link to={paths.object(task.object_id)}>
            <ArrowLeftIcon /> {task.object.name}
          </Link>
        ) : (
          <Link to={paths.myTasks}>
            <ArrowLeftIcon /> Мои задачи
          </Link>
        )}
      </Button>

      <PageHeader
        title={task.title}
        actions={
          isManager && (
            <>
              <Button variant="outline" onClick={() => setDialog('edit')}>
                <PencilIcon /> Редактировать
              </Button>
              <Button variant="outline" onClick={() => setDialog('delete')}>
                <Trash2Icon /> Удалить
              </Button>
            </>
          )
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardContent className="grid gap-6">
            <TaskDetails task={task} />
            <TaskActions
              status={task.status}
              role={role}
              isAssignee={isAssignee}
              onTransition={handleTransition}
              isPending={changeStatus.isPending}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>История</CardTitle>
          </CardHeader>
          <CardContent>
            {historyQuery.isPending ? (
              <p className="text-sm text-muted-foreground">Загрузка…</p>
            ) : (
              <TaskHistory entries={historyQuery.data ?? []} />
            )}
          </CardContent>
        </Card>
      </div>

      <FormDialog open={dialog === 'rework'} onOpenChange={(open) => !open && closeDialog()} title="На доработку">
        <ReworkCommentForm
          onSubmit={handleRework}
          onCancel={closeDialog}
          isSubmitting={changeStatus.isPending}
        />
      </FormDialog>

      {isManager && (
        <>
          <FormDialog open={dialog === 'edit'} onOpenChange={(open) => !open && closeDialog()} title="Редактировать задачу">
            <TaskForm
              executors={executorsQuery.data ?? []}
              defaultValues={{
                title: task.title,
                description: task.description,
                assignee_id: task.assignee_id ?? '',
              }}
              onSubmit={handleSave}
              onCancel={closeDialog}
              isSubmitting={saveTask.isPending}
            />
          </FormDialog>

          <ConfirmDialog
            open={dialog === 'delete'}
            onOpenChange={(open) => !open && closeDialog()}
            title="Удалить задачу?"
            description={`«${task.title}» и её история будут удалены безвозвратно.`}
            onConfirm={handleDelete}
            isPending={deleteTask.isPending}
          />
        </>
      )}
    </>
  )
}
