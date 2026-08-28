import type { ReactElement, ReactNode } from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { cn } from "./lib/cn"

/**
 * Shares one open/close delay across every tooltip below it, so sweeping
 * along a toolbar names the rest of the buttons instantly instead of making
 * the reader wait out the delay again at each one.
 */
const TooltipProvider = TooltipPrimitive.Provider

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  side = "right",
  sideOffset = 4,
  align = "center",
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<TooltipPrimitive.Positioner.Props, "align" | "side" | "sideOffset">) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        side={side}
        sideOffset={sideOffset}
        className="z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "w-fit max-w-xs rounded-md px-3 py-1.5",
            "bg-foreground text-xs text-background",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

interface HintProps {
  /** The tooltip copy. Omitted, `children` renders untouched. */
  label?: ReactNode
  /** Defaults to "bottom" — most call sites are horizontal toolbars. */
  side?: TooltipPrimitive.Positioner.Props["side"]
  /** Suppresses the tooltip without unmounting the trigger, e.g. mid-drag. */
  disabled?: boolean
  children: ReactElement
}

/**
 * Names an icon-only control on hover and on keyboard focus. Base UI's tooltip
 * is mouse-only, so this is inert on touch, and it contributes nothing to the
 * accessibility tree — the trigger's own `aria-label` stays the accessible name,
 * which is what the e2e suite addresses controls by.
 */
function Hint({ label, side = "bottom", disabled, children }: HintProps) {
  if (!label) return children
  return (
    <Tooltip>
      <TooltipTrigger disabled={disabled} render={children} />
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  )
}

export { Hint, Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
