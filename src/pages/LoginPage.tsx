import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from '@/components/LoginForm'
import { signIn } from '@/api/auth'
import { useAuth } from '@/app/AuthContext'
import { homePathFor } from '@/app/routes'
import type { LoginValues } from '@/domain/schemas'

export function LoginPage() {
  const { profile } = useAuth()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (profile) return <Navigate to={homePathFor(profile.role)} replace />

  async function handleSubmit({ email, password }: LoginValues) {
    setErrorMessage(null)
    try {
      await signIn(email, password)
    } catch {
      setErrorMessage('Неверный email или пароль')
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Мини-CRM</CardTitle>
          <CardDescription>Объекты и задачи. Войдите, чтобы продолжить.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm onSubmit={handleSubmit} errorMessage={errorMessage} />
        </CardContent>
      </Card>
    </main>
  )
}
