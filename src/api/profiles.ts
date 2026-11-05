import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/models'

export async function fetchExecutors(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'executor')
    .order('full_name')
  if (error) throw error
  return data
}
