import { useUpdateDashboardPrefix } from "@doska/core/mutations"
import { normalizePrefix, validatePrefix } from "@doska/core/operations"
import { RenameOneSheet } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import { useActiveBoard } from "@/lib/use-active-board"

export default function BoardPrefixSheet() {
  const { board, dashboards } = useActiveBoard()
  const { mutate: setPrefix } = useUpdateDashboardPrefix()
  if (!board) return null

  const current = board.prefix ?? ""
  // A prefix another board uses is rejected: `PREFIX-N` has to be unambiguous.
  const taken = dashboards
    .filter((one) => one.id !== board.id)
    .map((one) => one.prefix ?? "")

  return (
    <RenameOneSheet
      mono
      title="Card prefix"
      value={current}
      label="Board prefix"
      maxLength={6}
      autoCapitalize="characters"
      normalize={normalizePrefix}
      validate={(draft) => {
        const { prefix, error } = validatePrefix(draft, current, taken)
        return error === null ? { value: prefix ?? "" } : { error }
      }}
      footnote={(draft) => {
        const sample = draft || "PREFIX"
        return `Every card on this board is numbered ${sample}-1, ${sample}-2, and so on.`
      }}
      onCommit={(prefix) => setPrefix({ id: board.id, prefix })}
      // Past the actions sheet underneath, back to the board.
      onClose={() => router.dismissAll()}
    />
  )
}
