import type { ReactNode } from "react"

interface IProps {
  title?: string
  children: ReactNode
}

/** One block of the settings modal, ruled off from the one above it. */
export function SettingsSection({ title, children }: IProps) {
  return (
    <section className="flex flex-col gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
      {title && <h3 className="text-sm font-medium">{title}</h3>}
      {children}
    </section>
  )
}
