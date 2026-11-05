import { Loader2Icon } from 'lucide-react'

export function PageSpinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-label="Загрузка">
      <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}
