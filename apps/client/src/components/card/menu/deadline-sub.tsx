import {
  MenuContent,
  MenuItem,
  MenuSub,
  MenuSubTrigger,
  addDays,
  todayIso,
} from "@doska/ui-kit"
import { CalendarDays, Check } from "lucide-react"
import { useUpdateCard } from "@doska/core/mutations"
import { useCard } from "@doska/core/queries"

/** Presets rather than a calendar: a picker popover nested in the menu popup
 *  would count as an outside press and close the menu under itself. */
export function DeadlineSub({ cardId }: { cardId: string }) {
  const { data: card } = useCard(cardId)
  const { mutate: updateCard } = useUpdateCard(cardId)

  const value = card?.deadline ?? null
  const today = todayIso()
  const options = [
    { label: "Today", iso: today },
    { label: "Tomorrow", iso: addDays(today, 1) },
    { label: "In a week", iso: addDays(today, 7) },
  ]

  return (
    <MenuSub>
      <MenuSubTrigger>
        <CalendarDays />
        Deadline
      </MenuSubTrigger>
      <MenuContent align="start" sideOffset={2}>
        <MenuItem onClick={() => updateCard({ deadline: null })}>
          <CalendarDays className="text-muted-foreground" />
          No deadline
          {!value && <Check className="ml-auto" />}
        </MenuItem>
        {options.map((option) => (
          <MenuItem
            key={option.iso}
            onClick={() => updateCard({ deadline: option.iso })}
          >
            {option.label}
            {option.iso === value && <Check className="ml-auto" />}
          </MenuItem>
        ))}
      </MenuContent>
    </MenuSub>
  )
}
