import { PriorityInput } from "@doska/ui-kit"
import { PRIORITY_MAX, PRIORITY_MIN } from "@doska/contract"

interface IProps {
  value: number
  /** Omit where the viewer cannot edit the card — the number then just shows. */
  onChange?: (priority: number) => void
  className?: string
}

/**
 * A card's priority where it lives: in the title row, left of the "⋯" menu.
 * Clicking the number edits it in place; the card itself stays closed, so the
 * click must not reach the card underneath.
 */
export function CardPriority({ value, onChange, className }: IProps) {
  return (
    <span
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className="inline-flex"
    >
      <PriorityInput
        value={value}
        onChange={onChange}
        min={PRIORITY_MIN}
        max={PRIORITY_MAX}
        className={className}
      />
    </span>
  )
}
