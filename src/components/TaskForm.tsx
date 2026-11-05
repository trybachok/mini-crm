import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FieldGroup } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormField } from '@/components/FormField'
import { FormActions } from '@/components/FormActions'
import { taskSchema, type TaskValues } from '@/domain/schemas'
import type { Profile } from '@/types/models'

// Radix Select не принимает пустую строку как значение пункта.
const NO_ASSIGNEE = '__none__'

type TaskFormProps = {
  executors: Profile[]
  defaultValues?: TaskValues
  onSubmit: (values: TaskValues) => Promise<void> | void
  onCancel: () => void
  isSubmitting?: boolean
}

export function TaskForm({ executors, defaultValues, onSubmit, onCancel, isSubmitting }: TaskFormProps) {
  const form = useForm<TaskValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: defaultValues ?? { title: '', description: '', assignee_id: '' },
  })
  const { errors } = form.formState

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <FormField id="task-title" label="Название" error={errors.title}>
          <Input id="task-title" autoFocus {...form.register('title')} />
        </FormField>
        <FormField id="task-description" label="Описание" error={errors.description}>
          <Textarea id="task-description" rows={4} {...form.register('description')} />
        </FormField>
        <FormField id="task-assignee" label="Исполнитель" error={errors.assignee_id}>
          <Controller
            control={form.control}
            name="assignee_id"
            render={({ field }) => (
              <Select
                value={field.value || NO_ASSIGNEE}
                onValueChange={(value) => field.onChange(value === NO_ASSIGNEE ? '' : value)}
              >
                <SelectTrigger id="task-assignee" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_ASSIGNEE}>Не назначен</SelectItem>
                  {executors.map((executor) => (
                    <SelectItem key={executor.id} value={executor.id}>
                      {executor.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        <FormActions onCancel={onCancel} isSubmitting={isSubmitting} />
      </FieldGroup>
    </form>
  )
}
