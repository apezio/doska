import { SheetScreen } from "@doska/ui-kit-mobile"
import { useLocalSearchParams } from "expo-router"
import { ColumnActions } from "@/components/column/column-actions"
import { useActiveBoard } from "@/lib/use-active-board"

export default function ColumnActionsSheet() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { deckId } = useActiveBoard()
  if (!deckId || !id) return null

  return (
    <SheetScreen>
      <ColumnActions deckId={deckId} columnId={id} />
    </SheetScreen>
  )
}
