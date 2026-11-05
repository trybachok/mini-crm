import { z } from 'zod'

const requiredText = (message: string) => z.string().trim().min(1, message)

export const loginSchema = z.object({
  email: z.email('Введите корректный email'),
  password: z.string().min(6, 'Пароль не короче 6 символов'),
})
export type LoginValues = z.infer<typeof loginSchema>

export const objectSchema = z.object({
  name: requiredText('Укажите название объекта').max(200, 'Слишком длинное название'),
  address: z.string().trim().max(500, 'Слишком длинный адрес'),
})
export type ObjectValues = z.infer<typeof objectSchema>

export const taskSchema = z.object({
  title: requiredText('Укажите название задачи').max(200, 'Слишком длинное название'),
  description: z.string().trim().max(5000, 'Слишком длинное описание'),
  // Пустая строка в селекте означает «без исполнителя».
  assignee_id: z.string(),
})
export type TaskValues = z.infer<typeof taskSchema>

export const reworkCommentSchema = z.object({
  comment: requiredText('Опишите, что нужно доработать').max(2000, 'Слишком длинный комментарий'),
})
export type ReworkCommentValues = z.infer<typeof reworkCommentSchema>
