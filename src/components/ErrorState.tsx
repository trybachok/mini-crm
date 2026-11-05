import { Button } from '@/components/ui/button'

type ErrorStateProps = {
  message: string
  onRetry: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="rounded-lg border border-destructive/40 p-8 text-center text-sm">
      <p className="text-destructive">{message}</p>
      <Button variant="outline" className="mt-4" onClick={onRetry}>
        Повторить
      </Button>
    </div>
  )
}
