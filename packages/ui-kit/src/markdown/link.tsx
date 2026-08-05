import type { MouseEvent, ReactNode } from "react"

function stopPropagation(event: MouseEvent) {
  event.stopPropagation()
}

export function MdLink({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <a
      href={href}
      onClick={stopPropagation}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-2 decoration-primary/35 transition-[text-decoration-color] duration-150 hover:decoration-primary"
    >
      {children}
    </a>
  )
}
