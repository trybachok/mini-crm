import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

type NotFoundProps = {
  message?: string
  backTo: string
  backLabel: string
}

/** Показывается, когда запись не найдена или недоступна пользователю (RLS). */
export function NotFound({ message = 'Запись не найдена или у вас нет к ней доступа', backTo, backLabel }: NotFoundProps) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-muted-foreground">{message}</p>
      <Button variant="outline" asChild>
        <Link to={backTo}>{backLabel}</Link>
      </Button>
    </div>
  )
}
