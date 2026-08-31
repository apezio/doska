import { cn } from "@doska/ui-kit"
import { Check } from "lucide-react"

export function SyncBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute right-3 bottom-3 flex items-center gap-1.5 rounded-md bg-[#2c3345] px-2.5 py-1.5 text-[11px] font-medium text-white/60 shadow-lg ring-1 ring-primary",
        className
      )}
    >
      <Check className="size-3.5" />
      Synced
    </span>
  )
}
