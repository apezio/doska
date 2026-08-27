import { useState } from "react"
import {
  Button,
  cn,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@doska/ui-kit"
import { Folder, FolderSync } from "lucide-react"
import { useVault } from "@/lib/vault/use-vault"
import { VaultModal } from "./vault-modal"

interface IProps {
  boardId: string
}

/**
 * Opens the folder sync settings. The files are left behind when the sync
 * stops: unmounting stops the sync, it doesn't undo it.
 */
export function VaultButton({ boardId }: IProps) {
  const [open, setOpen] = useState(false)
  const { available, path, error, mount, unmount } = useVault(boardId)
  if (!available) return null

  const label = path ? `Syncing with ${path}` : "Sync with a folder"

  const button = (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      className={cn(
        error && "text-destructive",
        !error && path ? "text-foreground" : "text-muted-foreground"
      )}
      onClick={() => setOpen(true)}
    >
      {path ? <FolderSync /> : <Folder />}
    </Button>
  )

  return (
    <>
      <Tooltip>
        <TooltipTrigger render={button} />
        <TooltipContent>{error ?? label}</TooltipContent>
      </Tooltip>
      <VaultModal
        open={open}
        onOpenChange={setOpen}
        path={path}
        error={error}
        mount={mount}
        unmount={unmount}
      />
    </>
  )
}
