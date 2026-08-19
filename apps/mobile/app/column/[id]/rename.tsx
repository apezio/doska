import { useRenameColumn } from "@doska/core/mutations"
import { useBoard } from "@doska/core/queries"
import { SheetScreen } from "@doska/ui-kit-mobile"
import { router, useLocalSearchParams } from "expo-router"
import { RenameForm } from "@/components/shell/rename-form"
import { useActiveBoard } from "@/lib/use-active-board"

export default function ColumnRenameSheet() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { deckId } = useActiveBoard()
  if (!deckId || !id) return null

  return <Body deckId={deckId} columnId={id} />
}

function Body({ deckId, columnId }: { deckId: string; columnId: string }) {
  const { data: board } = useBoard(deckId)
  const { mutate: rename } = useRenameColumn(deckId)

  const column = board?.columns.find((one) => one.id === columnId)
  if (!column) return null

  return (
    <SheetScreen>
      <RenameForm
        title="Rename column"
        value={column.title}
        placeholder="Untitled column"
        label="Column name"
        onCommit={(title) => rename({ id: column.id, title })}
        onClose={() => router.back()}
      />
    </SheetScreen>
  )
}
