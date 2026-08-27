import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@doska/ui-kit"
import { Folder, FolderSync } from "lucide-react"
import { useVault } from "@/lib/vault/use-vault"

interface IProps {
  boardId: string
}

/**
 * Mirrors the board to a folder on disk, and stops when clicked again. The
 * files are left behind either way: unmounting stops the sync, it doesn't
 * undo it.
 */
export function VaultButton({ boardId }: IProps) {
  const { available, path, error, mount, unmount } = useVault(boardId)
  if (!available) return null

  const label = path ? `Syncing with ${path}` : "Sync with a folder"

  const button = (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      className={
        error
          ? "text-destructive"
          : path
            ? "text-foreground"
            : "text-muted-foreground"
      }
      onClick={() => (path ? unmount() : void mount())}
    >
      {path ? <FolderSync /> : <Folder />}
    </Button>
  )

  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent>{error ?? label}</TooltipContent>
    </Tooltip>
  )
}
