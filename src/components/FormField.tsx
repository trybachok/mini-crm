import type { ReactNode } from 'react'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'

type FormFieldProps = {
  /** id элемента ввода внутри — для связи с label. */
  id: string
  label: string
  error?: { message?: string }
  children: ReactNode
}

/** Поле формы: подпись, элемент ввода и текст ошибки под ним. */
export function FormField({ id, label, error, children }: FormFieldProps) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {children}
      <FieldError errors={[error]} />
    </Field>
  )
}
