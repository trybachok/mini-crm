import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { FieldGroup } from '@/components/ui/field'
import { FormField } from '@/components/FormField'
import { FormActions } from '@/components/FormActions'
import { objectSchema, type ObjectValues } from '@/domain/schemas'

type ObjectFormProps = {
  defaultValues?: ObjectValues
  onSubmit: (values: ObjectValues) => Promise<void> | void
  onCancel: () => void
  isSubmitting?: boolean
}

export function ObjectForm({ defaultValues, onSubmit, onCancel, isSubmitting }: ObjectFormProps) {
  const form = useForm<ObjectValues>({
    resolver: zodResolver(objectSchema),
    defaultValues: defaultValues ?? { name: '', address: '' },
  })
  const { errors } = form.formState

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <FormField id="object-name" label="Название" error={errors.name}>
          <Input id="object-name" autoFocus {...form.register('name')} />
        </FormField>
        <FormField id="object-address" label="Адрес" error={errors.address}>
          <Input id="object-address" {...form.register('address')} />
        </FormField>
        <FormActions onCancel={onCancel} isSubmitting={isSubmitting} />
      </FieldGroup>
    </form>
  )
}
