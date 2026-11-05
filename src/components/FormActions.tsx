import { Button } from '@/components/ui/button'

type FormActionsProps = {
  submitLabel?: string
  onCancel: () => void
  isSubmitting?: boolean
}

/** Кнопки «Отмена» и отправки для форм в диалогах. */
export function FormActions({ submitLabel = 'Сохранить', onCancel, isSubmitting }: FormActionsProps) {
  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
        Отмена
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {submitLabel}
      </Button>
    </div>
  )
}
