import { useMoveColumn } from "@doska/core/mutations"
import { useBoard } from "@doska/core/queries"
import { router } from "expo-router"
import { ReorderColumns } from "@/components/board/reorder-columns"
import { SheetScreen } from "@/components/ui/sheet"
import { useActiveBoard } from "@/lib/use-active-board"

function Reorder({ deckId }: { deckId: string }) {
  const { data: board } = useBoard(deckId)
  const { mutate: moveColumn } = useMoveColumn(deckId)

  return (
    <SheetScreen>
      <ReorderColumns
        columns={board?.columns ?? []}
        onReorder={(changed) => moveColumn(changed)}
        onClose={() => router.dismissAll()}
      />
    </SheetScreen>
  )
}

export default function BoardReorderSheet() {
  const { deckId } = useActiveBoard()
  if (!deckId) return null
  return <Reorder deckId={deckId} />
}
