import { cn, columnHue } from "@doska/ui-kit"
import type { ReactNode } from "react"

export function Column({
  title,
  color,
  className,
  children,
}: {
  title: string
  color: string
  className?: string
  children: ReactNode
}) {
  return (
    <section
      className={cn("flex w-[90vw] max-w-90 shrink-0 flex-col", className)}
    >
      <div className="mb-3 flex items-center gap-2 px-1 text-sm text-muted-foreground uppercase">
        <span
          className="size-2.5 rounded-full"
          style={{ background: `oklch(0.72 0.14 ${columnHue(color)})` }}
        />
        <h2 className="font-heading font-bold">{title}</h2>
      </div>
      <div
        className={cn(
          "flex flex-1 flex-col rounded-3xl border bg-background p-4",
          "shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]"
        )}
      >
        {children}
      </div>
    </section>
  )
}
