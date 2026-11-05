import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldError, FieldGroup } from '@/components/ui/field'
import { FormField } from '@/components/FormField'
import { loginSchema, type LoginValues } from '@/domain/schemas'

type LoginFormProps = {
  onSubmit: (values: LoginValues) => Promise<void> | void
  errorMessage?: string | null
}

export function LoginForm({ onSubmit, errorMessage }: LoginFormProps) {
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  const { errors, isSubmitting } = form.formState

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <FormField id="email" label="Email" error={errors.email}>
          <Input id="email" type="email" autoComplete="username" {...form.register('email')} />
        </FormField>
        <FormField id="password" label="Пароль" error={errors.password}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...form.register('password')}
          />
        </FormField>
        {errorMessage && <FieldError>{errorMessage}</FieldError>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Входим…' : 'Войти'}
        </Button>
      </FieldGroup>
    </form>
  )
}
