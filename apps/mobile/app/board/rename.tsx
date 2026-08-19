import { useRenameDashboard } from "@doska/core/mutations"
import { SheetScreen } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import { RenameForm } from "@/components/shell/rename-form"
import { useActiveBoard } from "@/lib/use-active-board"

export default function BoardRenameSheet() {
  const { board } = useActiveBoard()
  const { mutate: rename } = useRenameDashboard()
  if (!board) return null

  return (
    <SheetScreen>
      <RenameForm
        title="Rename board"
        value={board.title}
        placeholder="Untitled board"
        label="Board name"
        onCommit={(name) => rename({ id: board.id, name })}
        onClose={() => router.back()}
      />
    </SheetScreen>
  )
}
