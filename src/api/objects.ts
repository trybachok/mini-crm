import { supabase } from '@/lib/supabase'
import { paged, toPage, type Cursor, type Page } from '@/api/pagination'
import type { ConstructionObject } from '@/types/models'
import type { ObjectValues } from '@/domain/schemas'

export type ObjectWithTaskCount = ConstructionObject & { taskCount: number }

export async function fetchObjects(cursor: Cursor | null): Promise<Page<ObjectWithTaskCount>> {
  // tasks(count) проходит через RLS: исполнитель увидит число только своих задач.
  const { data, error } = await paged(supabase.from('objects').select('*, tasks(count)'), cursor)
  if (error) throw error
  return toPage(data.map(({ tasks, ...object }) => ({ ...object, taskCount: tasks[0]?.count ?? 0 })))
}

export async function fetchObject(objectId: string): Promise<ConstructionObject> {
  const { data, error } = await supabase.from('objects').select('*').eq('id', objectId).single()
  if (error) throw error
  return data
}

export async function createObject(values: ObjectValues): Promise<ConstructionObject> {
  const { data, error } = await supabase.from('objects').insert(values).select().single()
  if (error) throw error
  return data
}

export async function updateObject(objectId: string, values: ObjectValues): Promise<void> {
  const { error } = await supabase.from('objects').update(values).eq('id', objectId)
  if (error) throw error
}

export async function deleteObject(objectId: string): Promise<void> {
  const { error } = await supabase.from('objects').delete().eq('id', objectId)
  if (error) throw error
}
