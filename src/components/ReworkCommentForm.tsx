import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Textarea } from '@/components/ui/textarea'
import { FieldGroup } from '@/components/ui/field'
import { FormField } from '@/components/FormField'
import { FormActions } from '@/components/FormActions'
import { reworkCommentSchema, type ReworkCommentValues } from '@/domain/schemas'

type ReworkCommentFormProps = {
  onSubmit: (values: ReworkCommentValues) => Promise<void> | void
  onCancel: () => void
  isSubmitting?: boolean
}

export function ReworkCommentForm({ onSubmit, onCancel, isSubmitting }: ReworkCommentFormProps) {
  const form = useForm<ReworkCommentValues>({
    resolver: zodResolver(reworkCommentSchema),
    defaultValues: { comment: '' },
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <FormField id="rework-comment" label="Что нужно доработать" error={form.formState.errors.comment}>
          <Textarea id="rework-comment" rows={4} autoFocus {...form.register('comment')} />
        </FormField>
        <FormActions submitLabel="На доработку" onCancel={onCancel} isSubmitting={isSubmitting} />
      </FieldGroup>
    </form>
  )
}
