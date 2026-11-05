import { Button } from '@/components/ui/button'

type LoadMoreProps = {
  hasMore: boolean
  isLoading: boolean
  /** Текст ошибки последней подгрузки; кнопка остаётся, чтобы повторить. */
  errorMessage?: string | null
  onClick: () => void
}

/** Кнопка подгрузки следующей страницы; ничего не рендерит, когда страниц больше нет. */
export function LoadMore({ hasMore, isLoading, errorMessage, onClick }: LoadMoreProps) {
  if (!hasMore) return null
  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}
      <Button variant="outline" onClick={onClick} disabled={isLoading}>
        {isLoading ? 'Загрузка…' : errorMessage ? 'Повторить' : 'Показать ещё'}
      </Button>
    </div>
  )
}
