import { ChevronDown } from "lucide-react"
import { cn } from "@doska/ui-kit"

/** The platform's own picker, dressed like an `Input` — on a phone it opens
 * the native wheel, which beats any popover for a short list. */
export function NativeSelect({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <span className={cn("relative inline-flex min-w-0", className)}>
      <select
        {...props}
        className={cn(
          "h-8 w-full min-w-0 appearance-none truncate rounded-lg border border-input",
          "bg-transparent pr-7 pl-2.5 text-base outline-none md:text-sm dark:bg-input/30",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
    </span>
  )
}
