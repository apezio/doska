import type { ReactNode } from "react"

export function MdInlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-[0.3125rem] border border-border bg-muted/70 px-[0.35em] py-[0.1em] font-mono text-[0.8125em]">
      {children}
    </code>
  )
}
