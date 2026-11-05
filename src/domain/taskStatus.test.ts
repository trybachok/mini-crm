import { getAvailableTransitions, isTaskStatusFilter, statusesForFilter } from './taskStatus'
import type { TaskStatus, UserRole } from '@/types/models'

type Actor = { role: UserRole; isAssignee: boolean }

const manager: Actor = { role: 'manager', isAssignee: false }
const assignee: Actor = { role: 'executor', isAssignee: true }
const otherExecutor: Actor = { role: 'executor', isAssignee: false }

const targets = (status: TaskStatus, actor: Actor) =>
  getAvailableTransitions(status, actor).map((t) => t.to)

describe('getAvailableTransitions — таблица переходов из ТЗ', () => {
  it('Новая → В работе: только назначенный исполнитель', () => {
    expect(targets('new', assignee)).toEqual(['in_progress'])
    expect(targets('new', manager)).toEqual([])
    expect(targets('new', otherExecutor)).toEqual([])
  })

  it('В работе → На проверке: только назначенный исполнитель', () => {
    expect(targets('in_progress', assignee)).toEqual(['on_review'])
    expect(targets('in_progress', manager)).toEqual([])
    expect(targets('in_progress', otherExecutor)).toEqual([])
  })

  it('На проверке → Принята / На доработке: только постановщик', () => {
    expect(targets('on_review', manager)).toEqual(['accepted', 'rework'])
    expect(targets('on_review', assignee)).toEqual([])
    expect(targets('on_review', otherExecutor)).toEqual([])
  })

  it('На доработке → В работе: только назначенный исполнитель', () => {
    expect(targets('rework', assignee)).toEqual(['in_progress'])
    expect(targets('rework', manager)).toEqual([])
  })

  it('Принята: переходов нет ни у кого', () => {
    expect(targets('accepted', manager)).toEqual([])
    expect(targets('accepted', assignee)).toEqual([])
  })

  it('комментарий обязателен только для возврата на доработку', () => {
    const transitions = getAvailableTransitions('on_review', manager)
    expect(transitions.find((t) => t.to === 'rework')?.requiresComment).toBe(true)
    expect(transitions.find((t) => t.to === 'accepted')?.requiresComment).toBe(false)
  })

  it('действия исполнителя зависят от назначения, а не от роли (как в базе)', () => {
    expect(targets('new', { role: 'manager', isAssignee: true })).toEqual(['in_progress'])
  })
})

describe('statusesForFilter', () => {
  it('«Активные» — все статусы, кроме принятых', () => {
    expect(statusesForFilter('active')).toEqual(['new', 'in_progress', 'on_review', 'rework'])
  })

  it('«Все» — без ограничения, конкретный статус — только он', () => {
    expect(statusesForFilter('all')).toBeNull()
    expect(statusesForFilter('rework')).toEqual(['rework'])
  })

  it('isTaskStatusFilter отбрасывает мусор из URL', () => {
    expect(isTaskStatusFilter('active')).toBe(true)
    expect(isTaskStatusFilter('on_review')).toBe(true)
    expect(isTaskStatusFilter('deleted')).toBe(false)
    expect(isTaskStatusFilter(null)).toBe(false)
  })
})
