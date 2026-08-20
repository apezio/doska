import { cn, deadlineLabel } from "@doska/ui-kit"
import type { DigestCard, DigestGroup as Group } from "@doska/core/operations"
import { longDate, weekday } from "@doska/core/utils"
import { DigestRowView } from "./digest-row-view"

/** One date pile's heading and its cards. */
export function DigestGroup({
  group,
  openCardId,
  onOpenCard,
  showBoard = true,
}: {
  group: Group
  openCardId: string | null
  onOpenCard: (entry: DigestCard) => void
  /** Off inside a single board, where every row names the same board. */
  showBoard?: boolean
}) {
  const { kind, date, entries } = group
  return (
    <section className="mb-10">
      <h2 className="flex items-baseline gap-2 pb-2">
        <span
          className={cn(
            "text-md font-bold",
            kind === "overdue" && "text-destructive",
            kind === "undated" && "text-muted-foreground"
          )}
        >
          {kind === "date" && longDate(date)}
          {kind === "overdue" && "Overdue"}
          {kind === "undated" && "No deadline"}
        </span>
        {kind === "date" && (
          <>
            <span className="text-sm text-muted-foreground">
              {weekday(date)}
            </span>
            <span className="text-sm text-muted-foreground/70">
              {deadlineLabel(date)}
            </span>
          </>
        )}
      </h2>
      <ul className="space-y-3">
        {entries.map((entry) => (
          <DigestRowView
            key={entry.card.id}
            entry={entry}
            isActive={entry.card.id === openCardId}
            showBoard={showBoard}
            onOpen={() => onOpenCard(entry)}
          />
        ))}
      </ul>
    </section>
  )
}
