import { SheetScreen } from "@doska/ui-kit-mobile"
import { BoardActions } from "@/components/board/board-actions"
import { useActiveBoard } from "@/lib/use-active-board"

export default function BoardActionsSheet() {
  const { board } = useActiveBoard()
  if (!board) return null

  return (
    <SheetScreen>
      <BoardActions board={board} />
    </SheetScreen>
  )
}
