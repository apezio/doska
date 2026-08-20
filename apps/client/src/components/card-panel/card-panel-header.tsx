import { Button, cn, useIsMobile } from "@doska/ui-kit"
import { Eye, LocateFixed, PencilLine, Trash2, X } from "lucide-react"
import type { ReactNode } from "react"
import { hasOverlayTitleBar } from "@/lib/platform"
import { useIsFullscreen } from "@/lib/hooks"

interface IProps {
  onClose: () => void
  /** Omit where the card cannot be edited — the toggle has nothing to toggle to. */
  onTogglePreivew?: () => void
  isPreview: boolean
  onDelete?: () => void
  onReveal?: () => void
  actions?: ReactNode
}

export function CardPanelHeader({
  onClose,
  isPreview,
  onTogglePreivew,
  onDelete,
  onReveal,
  actions,
}: IProps) {
  const isMobile = useIsMobile()
  const isFullscreen = useIsFullscreen()
  const windowControlsInset = isMobile && hasOverlayTitleBar() && !isFullscreen

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between gap-2 px-3 pt-[max(0.625rem,env(safe-area-inset-top))] pb-2",
        windowControlsInset && "pl-24"
      )}
    >
      <div className="flex justify-start gap-1">
        {onReveal && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Reveal on board"
            onClick={onReveal}
          >
            <LocateFixed />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete card"
            className="text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 />
          </Button>
        )}
      </div>
      <div className="flex items-center justify-end gap-2">
        {actions}
        {onTogglePreivew && (
          <Button variant="ghost" size="icon-sm" onClick={onTogglePreivew}>
            {isPreview ? <PencilLine /> : <Eye />}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close card"
          onClick={onClose}
        >
          <X />
        </Button>
      </div>
    </div>
  )
}
