import { SheetScreen } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import { ColumnReorder } from "@/components/column/column-reorder"
import { useActiveBoard } from "@/lib/use-active-board"

export default function BoardReorderSheet() {
  const { deckId } = useActiveBoard()
  if (!deckId) return null

  return (
    <SheetScreen>
      <ColumnReorder deckId={deckId} onClose={() => router.dismissAll()} />
    </SheetScreen>
  )
}
