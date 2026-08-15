import { Button, cn, Toast } from "@doska/ui-kit"
import { Download } from "lucide-react"
import type { UpdateState } from "@/lib/updates"
import { useMemo } from "react"

type AvailableUpdate = Extract<UpdateState, { status: "available" }>

interface IProps {
  state: AvailableUpdate
  installing: boolean
  visible: boolean
  onInstall: () => void
}

export function UpdateToastContent({
  state,
  installing,
  visible,
  onInstall,
}: IProps) {
  const desktop = state.kind === "desktop"

  const installLabel = useMemo(() => {
    if (desktop) return installing ? "Installing…" : "Install"
    return installing ? "Loading…" : "Reload"
  }, [desktop, installing])

  return (
    <Toast visible={visible}>
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "flex max-w-md items-center gap-3 rounded-lg",
          "border bg-popover px-4 py-2 text-sm text-popover-foreground"
        )}
      >
        <span className="min-w-0">
          {desktop
            ? `Update to v${state.version} available`
            : "An update is available"}
        </span>
        <Button
          size="sm"
          className="shrink-0"
          disabled={installing}
          onClick={onInstall}
        >
          <Download className="size-4" />
          {installLabel}
        </Button>
      </div>
    </Toast>
  )
}
