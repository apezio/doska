import { useUpdateDashboardPrefix } from "@doska/core/mutations"
import { SheetScreen } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import { PrefixForm } from "@/components/board/prefix-form"
import { useActiveBoard } from "@/lib/use-active-board"

export default function BoardPrefixSheet() {
  const { board, dashboards } = useActiveBoard()
  const { mutate: setPrefix } = useUpdateDashboardPrefix()
  if (!board) return null

  const taken = dashboards
    .filter((one) => one.id !== board.id)
    .map((one) => one.prefix ?? "")

  return (
    <SheetScreen>
      <PrefixForm
        prefix={board.prefix ?? ""}
        taken={taken}
        onCommit={(prefix) => setPrefix({ id: board.id, prefix })}
        // Past the actions sheet underneath, back to the board.
        onClose={() => router.dismissAll()}
      />
    </SheetScreen>
  )
}
