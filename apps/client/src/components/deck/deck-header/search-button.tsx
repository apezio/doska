import { useCallback, useState } from "react"
import { Button } from "@doska/ui-kit"
import { Search } from "lucide-react"
import { SearchModal } from "../../search"
import { useSearchShortcut } from "@/lib/hooks"

interface IProps {
  boardId: string
  prefix: string
}

export function SearchButton({ boardId, prefix }: IProps) {
  const [open, setOpen] = useState(false)

  useSearchShortcut(useCallback(() => setOpen(true), []))

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Search cards"
        className="text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search />
      </Button>
      <SearchModal
        open={open}
        onOpenChange={setOpen}
        boardId={boardId}
        prefix={prefix}
      />
    </>
  )
}
