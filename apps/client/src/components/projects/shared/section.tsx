import { cn } from "@doska/ui-kit"
import type { ReactNode } from "react"

interface IProps {
  title: string
  /** Shown after the title, quieter — a count or a short status. */
  meta?: ReactNode
  /** Right-aligned header controls. */
  actions?: ReactNode
  className?: string
  children: ReactNode
}

export function Section({ title, meta, actions, className, children }: IProps) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <header className="flex min-h-7 items-center gap-2">
        <h2 className="text-sm font-semibold tracking-heading">{title}</h2>
        {meta !== undefined && (
          <span className="text-sm text-muted-foreground tabular-nums">
            {meta}
          </span>
        )}
        {actions && (
          <div className="ml-auto flex items-center gap-1">{actions}</div>
        )}
      </header>
      {children}
    </section>
  )
}
