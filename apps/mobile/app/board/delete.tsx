import { useDeleteDashboard } from "@doska/core/mutations"
import { ConfirmBody, SheetScreen } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import { useActiveBoard } from "@/lib/use-active-board"

export default function BoardDeleteSheet() {
  const { board } = useActiveBoard()
  const { mutate: deleteDashboard } = useDeleteDashboard()
  if (!board) return null

  return (
    <SheetScreen>
      <ConfirmBody
        title="Delete board?"
        description={`"${board.title}" and all of its columns and cards move to the trash, where they stay restorable for 14 days.`}
        confirmLabel="Delete board"
        onConfirm={() => deleteDashboard(board.id)}
        onClose={() => router.dismissAll()}
      />
    </SheetScreen>
  )
}
