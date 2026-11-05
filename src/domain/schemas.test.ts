import { loginSchema, objectSchema, reworkCommentSchema, taskSchema } from './schemas'

describe('schemas', () => {
  it('loginSchema: email и пароль обязательны', () => {
    expect(loginSchema.safeParse({ email: 'not-an-email', password: '123' }).success).toBe(false)
    expect(loginSchema.safeParse({ email: 'a@b.co', password: '123456' }).success).toBe(true)
  })

  it('objectSchema: название не может состоять из пробелов, адрес обрезается', () => {
    expect(objectSchema.safeParse({ name: '   ', address: '' }).success).toBe(false)
    const parsed = objectSchema.parse({ name: ' Объект ', address: ' Адрес ' })
    expect(parsed).toEqual({ name: 'Объект', address: 'Адрес' })
  })

  it('taskSchema: пустой исполнитель допустим', () => {
    expect(taskSchema.safeParse({ title: 'Задача', description: '', assignee_id: '' }).success).toBe(true)
    expect(taskSchema.safeParse({ title: '', description: '', assignee_id: '' }).success).toBe(false)
  })

  it('reworkCommentSchema: комментарий обязателен', () => {
    expect(reworkCommentSchema.safeParse({ comment: '  ' }).success).toBe(false)
    expect(reworkCommentSchema.safeParse({ comment: 'Переделать' }).success).toBe(true)
  })
})
