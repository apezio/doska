import {
  Button,
  CardContent,
  Modal,
  ModalContent,
  ModalHeader,
  cn,
} from "@doska/ui-kit"
import { FolderOpen } from "lucide-react"

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  path: string | null
  error: string | null
  mount: () => Promise<void>
  unmount: () => void
}

/**
 * The folder a board mirrors to, and the controls to pick it or stop.
 */
export function VaultModal({
  open,
  onOpenChange,
  path,
  error,
  mount,
  unmount,
}: IProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-lg">
        <ModalHeader onClose={() => onOpenChange(false)}>
          Folder sync
        </ModalHeader>
        <CardContent className="space-y-3 overflow-y-auto py-4">
          <div className="flex items-start gap-3">
            <FolderOpen className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="font-medium">Mirror this board to a folder</div>
              <p className="text-sm text-muted-foreground">
                One folder per column, one Markdown file per card. Edits go both
                ways, and deleted cards land in <code>_trash</code>.
              </p>
            </div>
            {path ? (
              <Button variant="secondary" size="sm" onClick={unmount}>
                Stop
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void mount()}
              >
                Choose folder
              </Button>
            )}
          </div>

          {path && (
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={path}
                aria-label="Synced folder"
                onFocus={(e) => e.currentTarget.select()}
                className={cn(
                  "min-w-0 flex-1 rounded-md border bg-muted/40 px-2 py-1.5",
                  "font-mono text-xs text-muted-foreground outline-none"
                )}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void mount()}
              >
                Change
              </Button>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </ModalContent>
    </Modal>
  )
}
