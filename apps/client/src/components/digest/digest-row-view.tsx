import { useState } from "react"
import type { DigestCard } from "@doska/core/operations"
import { useMoveCardToColumn } from "@doska/core/mutations"
import { useDashboardNav } from "@/lib/hooks"
import { DigestRow } from "./digest-row"
import { DoneColumnHelp } from "./done-column-help"

interface IProps {
  entry: DigestCard
  isActive: boolean
  showBoard?: boolean
  onOpen: () => void
}

/** Ticking a row moves the card, so the list item owns that write — and the
 * explanation shown when the board has nowhere to move it to. */
export function DigestRowView({ entry, isActive, showBoard, onOpen }: IProps) {
  const { card, boardId, isDone, doneColumnId, undoneColumnId } = entry
  const { selectDashboard } = useDashboardNav()
  const { mutate: moveCardToColumn } = useMoveCardToColumn()
  const [helpOpen, setHelpOpen] = useState(false)

  // Null when the board has no done column, and then there is nowhere to send it.
  const target = isDone ? undoneColumnId : doneColumnId

  return (
    <li>
      <DigestRow
        entry={entry}
        isActive={isActive}
        showBoard={showBoard}
        canToggleDone={target !== null}
        onOpen={onOpen}
        onToggleDone={() => {
          if (target) moveCardToColumn({ id: card.id, columnId: target })
          else setHelpOpen(true)
        }}
        onOpenBoard={() => selectDashboard(boardId)}
      />
      {!target && (
        <DoneColumnHelp
          open={helpOpen}
          onOpenChange={setHelpOpen}
          boardId={boardId}
          onOpenBoard={() => selectDashboard(boardId)}
        />
      )}
    </li>
  )
}
