import { StatusBadge } from '@/components/StatusBadge'
import { formatDateTime } from '@/lib/format'
import type { TaskHistoryWithAuthor } from '@/api/history'

/** История смены статусов задачи в хронологическом порядке. */
export function TaskHistory({ entries }: { entries: TaskHistoryWithAuthor[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">История пуста</p>
  }

  return (
    <ol className="relative ml-2 border-l pl-5">
      {entries.map((entry) => (
        <li key={entry.id} className="relative pb-5 last:pb-0">
          <span className="absolute top-1.5 -left-[1.6rem] size-2.5 rounded-full border-2 border-background bg-foreground" />
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            {entry.from_status ? (
              <>
                <StatusBadge status={entry.from_status} />
                <span className="text-muted-foreground">→</span>
                <StatusBadge status={entry.to_status} />
              </>
            ) : (
              <>
                <span className="text-muted-foreground">Создана</span>
                <StatusBadge status={entry.to_status} />
              </>
            )}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {entry.changed_by_profile.full_name} · {formatDateTime(entry.created_at)}
          </div>
          {entry.comment && (
            <p className="mt-2 rounded-md bg-muted p-2 text-sm whitespace-pre-wrap">{entry.comment}</p>
          )}
        </li>
      ))}
    </ol>
  )
}
