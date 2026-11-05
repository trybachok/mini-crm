import { getErrorMessage } from './errors'

describe('getErrorMessage', () => {
  it('возвращает текст ошибки базы как есть', () => {
    expect(getErrorMessage({ message: 'Переход new → accepted недоступен' })).toBe(
      'Переход new → accepted недоступен',
    )
    expect(getErrorMessage(new Error('Задача не найдена'))).toBe('Задача не найдена')
  })

  it('переводит сетевые ошибки браузера в понятный текст', () => {
    expect(getErrorMessage({ message: 'TypeError: Failed to fetch' })).toMatch(/Нет связи/)
    expect(getErrorMessage(new TypeError('Load failed'))).toMatch(/Нет связи/)
  })

  it('технические ошибки Postgres/PostgREST не показывает пользователю', () => {
    expect(getErrorMessage({ message: 'new row violates row-level security policy for table "tasks"' })).toMatch(
      /Что-то пошло не так/,
    )
    expect(getErrorMessage({ message: 'permission denied for table task_status_history' })).toMatch(
      /Что-то пошло не так/,
    )
  })

  it('для неизвестных ошибок даёт запасной текст', () => {
    expect(getErrorMessage(null)).toMatch(/Что-то пошло не так/)
    expect(getErrorMessage({ message: '' })).toMatch(/Что-то пошло не так/)
  })
})
