import type { ReactNode } from "react"

export function MdListItem({ children }: { children: ReactNode }) {
  return <li className="my-[0.2rem]">{children}</li>
}
