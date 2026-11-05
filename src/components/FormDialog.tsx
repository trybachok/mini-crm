import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type FormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
}

/** Диалог с формой: одинаковая ширина и отступы для всех форм приложения. */
export function FormDialog({ open, onOpenChange, title, children }: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Описания у форм нет — явно говорим об этом Radix, чтобы не было предупреждения в консоли. */}
      <DialogContent className="w-[min(32rem,95vw)]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
