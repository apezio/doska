import { Check, ChevronDown } from "lucide-react"
import { cn, Menu, MenuContent, MenuItem, MenuTrigger } from "@doska/ui-kit"
import { TONE_DOT, TONE_PILL, type Tone } from "./status"

interface IProps<S extends string> {
  value: S
  options: Record<S, { label: string; tone: Tone }>
  onChange: (next: S) => void
  /** Names the control for assistive tech, e.g. "Project status". */
  label: string
  disabled?: boolean
}

/** A status pill that opens a menu of the other statuses. */
export function StatusMenu<S extends string>({
  value,
  options,
  onChange,
  label,
  disabled,
}: IProps<S>) {
  const current = options[value]
  return (
    <Menu>
      <MenuTrigger
        aria-label={`${label}: ${current.label}`}
        disabled={disabled}
        className={cn(
          "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full pr-1.5 pl-2",
          "text-xs font-semibold whitespace-nowrap transition-[filter] outline-none",
          "hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:opacity-60 dark:hover:brightness-110",
          TONE_PILL[current.tone]
        )}
      >
        <span className={cn("size-1.5 rounded-full", TONE_DOT[current.tone])} />
        {current.label}
        <ChevronDown className="size-3 opacity-70" />
      </MenuTrigger>
      <MenuContent align="start" className="py-1">
        {(Object.keys(options) as S[]).map((s) => (
          <MenuItem key={s} onClick={() => s !== value && onChange(s)}>
            <span
              className={cn("size-2 rounded-full", TONE_DOT[options[s].tone])}
            />
            <span className="flex-1">{options[s].label}</span>
            {s === value && <Check className="text-muted-foreground" />}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  )
}
