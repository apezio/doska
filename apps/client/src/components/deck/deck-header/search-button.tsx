import { useCallback, useState } from "react"
import { Button, Hint, isMac, shortcutLabel } from "@doska/ui-kit"
import { Search } from "lucide-react"
import { SearchModal } from "../../search"
import { useSearchShortcut } from "@/lib/hooks"

export function SearchButton({ boardId }: { boardId: string }) {
  const [open, setOpen] = useState(false)

  useSearchShortcut(useCallback(() => setOpen(true), []))

  return (
    <>
      <Hint
        label={
          <>
            Search cards{" "}
            <span className="opacity-60">{shortcutLabel("K")}</span>
          </>
        }
      >
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Search cards"
          aria-keyshortcuts={isMac() ? "Meta+K" : "Control+K"}
          className="text-muted-foreground"
          onClick={() => setOpen(true)}
        >
          <Search />
        </Button>
      </Hint>
      <SearchModal open={open} onOpenChange={setOpen} boardId={boardId} />
    </>
  )
}
