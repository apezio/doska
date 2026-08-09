import { cn } from "@doska/ui-kit"
import { Anchor } from "lucide-react"

interface IProps {
  title: string
}

/**
 * A public board's top bar. The app's header is a sidebar trigger beside an
 * editable name; here there is no sidebar and nothing to rename, so the space
 * goes to the board's name and, opposite it, where the board came from.
 */
export function PublicHeader({ title }: IProps) {
  return (
    <header
      className={cn(
        "flex h-11.5 shrink-0 items-center gap-2 border-b px-4",
        "pt-[env(safe-area-inset-top)]"
      )}
    >
      <span className="min-w-0 truncate text-base font-semibold">{title}</span>
      <a
        href="https://doska.sh"
        target="_blank"
        className="ml-auto flex shrink-0 items-center gap-1 text-muted-foreground hover:text-foreground"
      >
        <span className="pr-1 text-[12px]">made with</span>
        <Anchor className="size-4 shrink-0" />
        <span className="font-semibold">Doska</span>
      </a>
    </header>
  )
}
