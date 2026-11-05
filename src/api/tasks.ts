import { supabase } from '@/lib/supabase'
import { paged, toPage, type Cursor, type Page } from '@/api/pagination'
import type { Task, TaskStatus } from '@/types/models'
import type { TaskValues } from '@/domain/schemas'

// У tasks две ссылки на profiles (исполнитель и автор), поэтому указываем FK явно.
const taskRelations = `
  object:objects(id, name),
  assignee:profiles!tasks_assignee_id_fkey(id, full_name),
  author:profiles!tasks_author_id_fkey(id, full_name)
`
const taskSelect = `*, ${taskRelations}`
// В списках description не показывается — не гоняем длинный текст по сети.
const taskListSelect = `id, title, object_id, assignee_id, author_id, status, created_at, updated_at, ${taskRelations}`

type TaskRelations = {
  object: { id: string; name: string }
  assignee: { id: string; full_name: string } | null
  author: { id: string; full_name: string }
}

export type TaskWithRelations = Task & TaskRelations
export type TaskListItem = Omit<Task, 'description'> & TaskRelations

type TaskListParams = {
  /** Статусы для фильтра; null — все. */
  statuses: TaskStatus[] | null
  cursor: Cursor | null
}

/** Общая часть списков задач: фильтр по статусу и страница. */
function taskListQuery({ statuses, cursor }: TaskListParams) {
  let query = supabase.from('tasks').select(taskListSelect)
  if (statuses) query = query.in('status', statuses)
  return paged(query, cursor)
}

export async function fetchTasksByObject(objectId: string, params: TaskListParams): Promise<Page<TaskListItem>> {
  const { data, error } = await taskListQuery(params).eq('object_id', objectId)
  if (error) throw error
  return toPage(data)
}

export async function fetchMyTasks(userId: string, params: TaskListParams): Promise<Page<TaskListItem>> {
  const { data, error } = await taskListQuery(params).eq('assignee_id', userId)
  if (error) throw error
  return toPage(data)
}

export async function fetchTask(taskId: string): Promise<TaskWithRelations> {
  const { data, error } = await supabase.from('tasks').select(taskSelect).eq('id', taskId).single()
  if (error) throw error
  return data
}

/** Пустой assignee_id из формы превращаем в null. */
function toTaskRow(values: TaskValues) {
  return {
    title: values.title,
    description: values.description,
    assignee_id: values.assignee_id || null,
  }
}

export async function createTask(objectId: string, values: TaskValues): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ object_id: objectId, ...toTaskRow(values) })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTask(taskId: string, values: TaskValues): Promise<void> {
  const { error } = await supabase.from('tasks').update(toTaskRow(values)).eq('id', taskId)
  if (error) throw error
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
  if (error) throw error
}

/** Единственный способ сменить статус: проверки — в функции базы. */
export async function changeTaskStatus(
  taskId: string,
  newStatus: TaskStatus,
  comment?: string,
): Promise<Task> {
  const { data, error } = await supabase.rpc('change_task_status', {
    task_id: taskId,
    new_status: newStatus,
    comment,
  })
  if (error) throw error
  return data
}
