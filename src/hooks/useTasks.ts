import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  changeTaskStatus,
  createTask,
  deleteTask,
  fetchMyTasks,
  fetchTask,
  fetchTasksByObject,
  updateTask,
} from '@/api/tasks'
import { fetchTaskHistory } from '@/api/history'
import { fetchExecutors } from '@/api/profiles'
import { queryKeys } from '@/hooks/queryKeys'
import { usePagedQuery } from '@/hooks/pagination'
import { statusesForFilter, type TaskStatusFilter } from '@/domain/taskStatus'
import type { TaskValues } from '@/domain/schemas'
import type { TaskStatus } from '@/types/models'

export function useTasksByObject(objectId: string, filter: TaskStatusFilter) {
  const statuses = statusesForFilter(filter)
  return usePagedQuery(queryKeys.tasksByObject(objectId, filter), (cursor) =>
    fetchTasksByObject(objectId, { statuses, cursor }),
  )
}

export function useMyTasks(userId: string | undefined, filter: TaskStatusFilter) {
  const statuses = statusesForFilter(filter)
  return usePagedQuery(
    queryKeys.myTasks(userId ?? '', filter),
    (cursor) => fetchMyTasks(userId ?? '', { statuses, cursor }),
    Boolean(userId),
  )
}

export function useTask(taskId: string) {
  return useQuery({ queryKey: queryKeys.task(taskId), queryFn: () => fetchTask(taskId) })
}

export function useTaskHistory(taskId: string) {
  return useQuery({ queryKey: queryKeys.history(taskId), queryFn: () => fetchTaskHistory(taskId) })
}

/** Список исполнителей нужен только постановщику — для остальных запрос не выполняется. */
export function useExecutors(enabled = true) {
  return useQuery({
    queryKey: queryKeys.executors,
    queryFn: fetchExecutors,
    staleTime: 5 * 60_000,
    enabled,
  })
}

/** После любого изменения задач обновляем списки задач и счётчики у объектов. */
function useInvalidateTasks() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks }),
      queryClient.invalidateQueries({ queryKey: queryKeys.objects }),
    ])
}

// Ошибки мутаций показывает toast из MutationCache (см. app/queryClient.ts).
export function useSaveTask(objectId: string) {
  return useMutation({
    mutationFn: async ({ taskId, values }: { taskId?: string; values: TaskValues }) => {
      if (taskId) await updateTask(taskId, values)
      else await createTask(objectId, values)
    },
    onSuccess: useInvalidateTasks(),
  })
}

export function useDeleteTask() {
  return useMutation({ mutationFn: deleteTask, onSuccess: useInvalidateTasks() })
}

export function useChangeTaskStatus(taskId: string) {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateTasks()
  return useMutation({
    mutationFn: ({ newStatus, comment }: { newStatus: TaskStatus; comment?: string }) =>
      changeTaskStatus(taskId, newStatus, comment),
    onSuccess: async () => {
      await invalidate()
      await queryClient.invalidateQueries({ queryKey: queryKeys.history(taskId) })
    },
  })
}
