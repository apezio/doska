import {
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  PRIORITIES,
  PriorityChip,
  cn,
} from "@doska/ui-kit"
import { Check, Flag } from "lucide-react"

interface IProps {
  value: string
  onChange?: (priority: string) => void
  className?: string
}

/** Card priority as a color-coded chip. */
export function CardPriority({ value, onChange, className }: IProps) {
  if (!onChange) return <PriorityChip value={value} className={className} />

  const isSet = PRIORITIES.some((p) => p.id === value)

  return (
    <span onClick={(e) => e.stopPropagation()} className="inline-flex">
      <Menu>
        <MenuTrigger
          render={
            <button
              type="button"
              aria-label="Card priority"
              className={cn(
                "inline-flex cursor-pointer items-center",
                className
              )}
            />
          }
        >
          {isSet ? (
            <PriorityChip value={value} />
          ) : (
            <Flag className="size-3.5 text-muted-foreground hover:text-foreground" />
          )}
        </MenuTrigger>
        <MenuContent align="start">
          <MenuItem onClick={() => onChange("")}>
            <Flag className="size-3.5 text-muted-foreground" />
            No priority
            {!isSet && <Check className="ml-auto" />}
          </MenuItem>
          {PRIORITIES.map((option) => (
            <MenuItem key={option.id} onClick={() => onChange(option.id)}>
              <PriorityChip value={option.id} />
              {option.label}
              {option.id === value && <Check className="ml-auto" />}
            </MenuItem>
          ))}
        </MenuContent>
      </Menu>
    </span>
  )
}
