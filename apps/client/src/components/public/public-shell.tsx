import type { ReactNode } from "react"
import { cn } from "@doska/ui-kit"
import { PublicHeader } from "./public-header"

interface IProps {
  title?: string
  isCardOpen?: boolean
  children: ReactNode
  panel?: ReactNode
}

/**
 * The card the whole public page lives in
 */
export function PublicShell({ title, isCardOpen, children, panel }: IProps) {
  return (
    <div className="flex h-(--app-height,100svh) w-full overflow-hidden bg-sidebar">
      <main
        className={cn(
          "relative flex w-full min-w-0 flex-1 flex-col overflow-hidden",
          "border border-border bg-background",
          "md:m-2 md:rounded-xl md:shadow-sm",
          "md:transition-[margin] md:duration-200 md:ease-linear",
          isCardOpen && "md:mr-0"
        )}
      >
        <PublicHeader title={title} />
        {children}
      </main>
      {panel}
    </div>
  )
}
