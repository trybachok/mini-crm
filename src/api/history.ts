import { supabase } from '@/lib/supabase'
import type { TaskHistoryEntry } from '@/types/models'

export type TaskHistoryWithAuthor = TaskHistoryEntry & {
  changed_by_profile: { full_name: string }
}

export async function fetchTaskHistory(taskId: string): Promise<TaskHistoryWithAuthor[]> {
  const { data, error } = await supabase
    .from('task_status_history')
    .select('*, changed_by_profile:profiles(full_name)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}
