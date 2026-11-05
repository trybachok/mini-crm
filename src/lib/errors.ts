const FALLBACK = 'Что-то пошло не так. Попробуйте ещё раз.'
const OFFLINE = 'Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.'

// Так браузеры (Chrome / Firefox / Safari) описывают упавший fetch; supabase-js пробрасывает текст как есть.
const networkErrorPattern = /Failed to fetch|NetworkError|Load failed/i

// Сообщения наших SQL-функций написаны по-русски. Всё, что без кириллицы, — технические
// ошибки Postgres/PostgREST (английские, с именами таблиц и политик) — пользователю не показываем.
const cyrillicPattern = /[а-яё]/i

/** Текст ошибки для пользователя: свои сообщения — как есть, чужие — заменяем общим текстом. */
export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message
    if (typeof message === 'string') {
      if (networkErrorPattern.test(message)) return OFFLINE
      if (cyrillicPattern.test(message)) return message
    }
  }
  return FALLBACK
}
