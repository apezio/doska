import { useState } from "react"
import { PanelLeft } from "lucide-react"
import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  cn,
} from "@doska/ui-kit"
import { depth, docs, type DocPage } from "./pages"

/**
 * A sticky column on desktop; on mobile the same list, in the drawer the app
 * puts its boards in. Which one shows is a media query rather than a measured
 * breakpoint, so the prerendered HTML matches whatever hydrates it.
 */
export function DocsNav({ current }: { current: DocPage }) {
  return (
    <>
      <DocsDrawer current={current} />
      <nav className="hidden md:block md:w-52 md:shrink-0">
        <div className="sticky top-20">
          <DocsLinks current={current} />
        </div>
      </nav>
    </>
  )
}

function DocsDrawer({ current }: { current: DocPage }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-6 md:hidden">
      <Button
        variant="muted"
        className="h-10 w-full justify-between gap-2 px-3"
        onClick={() => setOpen(true)}
      >
        <span className="flex items-center gap-1.5">
          <PanelLeft className="size-4" />
          <span className="text-muted-foreground">Docs</span>
        </span>
        <span className="font-semibold">{current.nav}</span>
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="gap-0">
          <SheetHeader>
            <SheetTitle>Documentation</SheetTitle>
          </SheetHeader>
          {/* Links are full page loads, so the drawer never needs closing. */}
          <div className="overflow-y-auto px-2 pb-4">
            <DocsLinks current={current} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function DocsLinks({ current }: { current: DocPage }) {
  return (
    <ul className="flex flex-col gap-1">
      {docs.map((doc) => (
        <li key={doc.path} className={cn(depth(doc) > 1 && "ml-4")}>
          <a
            href={doc.path}
            aria-current={doc === current ? "page" : undefined}
            className={cn(
              "block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              doc === current && "bg-muted font-semibold text-foreground"
            )}
          >
            {doc.nav}
          </a>
        </li>
      ))}
    </ul>
  )
}
