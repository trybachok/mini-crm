import { useSearchParams } from 'react-router-dom'
import {
  defaultTaskStatusFilter,
  isTaskStatusFilter,
  type TaskStatusFilter,
} from '@/domain/taskStatus'

const PARAM = 'status'

/** Фильтр статуса хранится в URL (?status=…): переживает перезагрузку и кнопку «назад». */
export function useTaskStatusFilter(): [TaskStatusFilter, (filter: TaskStatusFilter) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get(PARAM)
  const filter = isTaskStatusFilter(raw) ? raw : defaultTaskStatusFilter

  const setFilter = (next: TaskStatusFilter) => {
    setSearchParams(
      (params) => {
        if (next === defaultTaskStatusFilter) params.delete(PARAM)
        else params.set(PARAM, next)
        return params
      },
      { replace: true },
    )
  }

  return [filter, setFilter]
}
