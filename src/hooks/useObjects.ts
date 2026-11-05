import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createObject, deleteObject, fetchObject, fetchObjects, updateObject } from '@/api/objects'
import { queryKeys } from '@/hooks/queryKeys'
import { usePagedQuery } from '@/hooks/pagination'
import type { ObjectValues } from '@/domain/schemas'

export function useObjects() {
  return usePagedQuery(queryKeys.objects, fetchObjects)
}

export function useObject(objectId: string) {
  return useQuery({ queryKey: queryKeys.object(objectId), queryFn: () => fetchObject(objectId) })
}

function useInvalidateObjects() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.objects })
}

// Ошибки мутаций показывает toast из MutationCache (см. app/queryClient.ts).
export function useSaveObject() {
  return useMutation({
    mutationFn: async ({ objectId, values }: { objectId?: string; values: ObjectValues }) => {
      if (objectId) await updateObject(objectId, values)
      else await createObject(values)
    },
    onSuccess: useInvalidateObjects(),
  })
}

export function useDeleteObject() {
  return useMutation({ mutationFn: deleteObject, onSuccess: useInvalidateObjects() })
}
