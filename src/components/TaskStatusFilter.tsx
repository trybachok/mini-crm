import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  isTaskStatusFilter,
  taskStatusFilterLabels,
  taskStatusFilterOptions,
  type TaskStatusFilter as Filter,
} from '@/domain/taskStatus'

type TaskStatusFilterProps = {
  value: Filter
  onChange: (value: Filter) => void
}

export function TaskStatusFilter({ value, onChange }: TaskStatusFilterProps) {
  return (
    <Select value={value} onValueChange={(next) => isTaskStatusFilter(next) && onChange(next)}>
      <SelectTrigger aria-label="Статус" className="w-full sm:w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {taskStatusFilterOptions.map((option) => (
          <SelectItem key={option} value={option}>
            {taskStatusFilterLabels[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
