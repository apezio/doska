import { cn } from "@doska/ui-kit"
import { TONE_DOT, TONE_PILL, type Tone } from "./status"

interface IProps {
  tone: Tone
  label: string
  className?: string
}

export function StatusPill({ tone, label, className }: IProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5.5 shrink-0 items-center gap-1.5 rounded-full px-2",
        "text-xs font-semibold whitespace-nowrap",
        TONE_PILL[tone],
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", TONE_DOT[tone])} />
      {label}
    </span>
  )
}
