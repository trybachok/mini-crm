// Короткие имена для типов, сгенерированных из схемы базы (database.ts).

import type { Database, Tables } from '@/types/database'

export type UserRole = Database['public']['Enums']['user_role']
export type TaskStatus = Database['public']['Enums']['task_status']

export type Profile = Tables<'profiles'>
export type ConstructionObject = Tables<'objects'>
export type Task = Tables<'tasks'>
export type TaskHistoryEntry = Tables<'task_status_history'>
