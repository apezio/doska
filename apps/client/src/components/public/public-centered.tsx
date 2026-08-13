import type { ReactNode } from "react"

export function PublicCentered({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center px-6">
      {children}
    </div>
  )
}
