import { Button, cn, useIsMobile } from "@doska/ui-kit"
import { Eye, PencilLine, X } from "lucide-react"
import type { ReactNode } from "react"
import { hasOverlayTitleBar } from "@/lib/platform"

interface IProps {
  onClose: () => void
  /** Omit where the card cannot be edited — the toggle has nothing to toggle to. */
  onTogglePreivew?: () => void
  isPreview: boolean
  /** Omit where there is nothing to save. */
  onSave?: () => void
  /** Extra controls before the toggle — attaching a file, where that is possible. */
  actions?: ReactNode
}

export function CardPanelHeader({
  onClose,
  isPreview,
  onSave,
  onTogglePreivew,
  actions,
}: IProps) {
  const isMobile = useIsMobile()
  const windowControlsInset = isMobile && hasOverlayTitleBar()

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between gap-2 px-3 pt-[max(0.625rem,env(safe-area-inset-top))] pb-2",
        windowControlsInset && "pl-24"
      )}
    >
      <div className="flex w-20 justify-start">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close card"
          onClick={onClose}
        >
          <X />
        </Button>
      </div>
      <div className="flex justify-end space-x-2">
        {actions}
        {onTogglePreivew && (
          <Button variant="ghost" size="sm" onClick={onTogglePreivew}>
            {isPreview ? <PencilLine /> : <Eye />}
            {isPreview ? "Edit" : "Preview"}
          </Button>
        )}
        {onSave && (
          <Button size="sm" onClick={onSave}>
            Save
          </Button>
        )}
      </div>
    </div>
  )
}
