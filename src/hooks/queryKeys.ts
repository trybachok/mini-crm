import type { TaskStatusFilter } from '@/domain/taskStatus'

export const queryKeys = {
  objects: ['objects'] as const,
  object: (objectId: string) => ['objects', objectId] as const,
  tasks: ['tasks'] as const,
  tasksByObject: (objectId: string, filter: TaskStatusFilter) =>
    ['tasks', 'byObject', objectId, filter] as const,
  myTasks: (userId: string, filter: TaskStatusFilter) => ['tasks', 'mine', userId, filter] as const,
  task: (taskId: string) => ['tasks', 'one', taskId] as const,
  history: (taskId: string) => ['history', taskId] as const,
  executors: ['executors'] as const,
}
