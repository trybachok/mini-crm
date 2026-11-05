import { homePathFor, paths } from './routes'

describe('homePathFor', () => {
  it('исполнителя отправляет в «Мои задачи», постановщика — к объектам', () => {
    expect(homePathFor('executor')).toBe(paths.myTasks)
    expect(homePathFor('manager')).toBe(paths.objects)
  })
})
