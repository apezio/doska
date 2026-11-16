import type { ComponentProps } from "react"
import { cn } from "@doska/ui-kit"
import { useTheme } from "@/providers/theme/theme-context"

/**
 * A Miss Claude page at 80%: the box keeps the size `className` gives it,
 * while the page lays out 25% larger and is scaled down to fit. Absolute, so
 * the 125% resolves even when the box is only sized by flex.
 *
 * `?theme=` hands it Doska's light or dark so it can match; switching theme
 * reloads the frame.
 */
export function ChatFrame({
  className,
  src,
  ...props
}: ComponentProps<"iframe"> & { src: string }) {
  const { theme } = useTheme()
  const themed = new URL(src, location.href)
  themed.searchParams.set("theme", theme)

  return (
    <div className={cn("relative overflow-hidden bg-background", className)}>
      <iframe
        {...props}
        src={themed.href}
        className="absolute top-0 left-0 h-[125%] w-[125%] origin-top-left scale-80 border-0"
      />
    </div>
  )
}
