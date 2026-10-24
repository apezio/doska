import { cn } from "@doska/ui-kit"

/** A session touched the project recently. The pulse is the only ambient
 * motion on these pages, so it stays reserved for that. */
export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex size-2", className)} aria-hidden>
      <span className="absolute inset-0 rounded-full bg-primary/60 motion-safe:animate-ping" />
      <span className="relative size-2 rounded-full bg-primary" />
    </span>
  )
}
