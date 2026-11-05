// Русские подписи для значений из базы. Единственное место, где они живут.

import type { UserRole } from '@/types/models'

export const roleLabels: Record<UserRole, string> = {
  manager: 'Постановщик',
  executor: 'Исполнитель',
}
