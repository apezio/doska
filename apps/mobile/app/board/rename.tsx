import { useRenameDashboard } from "@doska/core/mutations"
import { RenameOneSheet } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import { useActiveBoard } from "@/lib/use-active-board"

export default function BoardRenameSheet() {
  const { board } = useActiveBoard()
  const { mutate: rename } = useRenameDashboard()
  if (!board) return null

  return (
    <RenameOneSheet
      title="Rename board"
      value={board.title}
      label="Board name"
      placeholder="Untitled board"
      onCommit={(name) => rename({ id: board.id, name })}
      onClose={() => router.back()}
    />
  )
}
