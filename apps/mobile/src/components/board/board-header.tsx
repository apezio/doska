import {
  useDeleteDashboard,
  useMoveColumn,
  useRenameDashboard,
  useUpdateDashboardPrefix,
} from "@doska/core/mutations"
import type { Column, Dashboard } from "@doska/core/types"
import {
  ArrowRightLeft,
  Hash,
  MoreHorizontal,
  Trash2,
} from "lucide-react-native"
import { useState } from "react"
import { Pressable, TextInput, View } from "react-native"
import { ConfirmBody } from "@/components/ui/confirm-body"
import { ScreenHeader } from "@/components/ui/screen-header"
import { Sheet, SheetItem } from "@/components/ui/sheet"
import { useTokens } from "@/lib/tokens"
import { PrefixForm } from "./prefix-form"
import { ReorderColumns } from "./reorder-columns"

type SheetName = "actions" | "prefix" | "reorder" | "delete"

interface IProps {
  board: Dashboard
  columns: Column[]
  /** Every other live board's prefix, for the uniqueness check. */
  takenPrefixes: string[]
}

/** The board's top bar: the drawer toggle, the editable board name, and the
 * same actions the web keeps behind its `⋯` menu. */
export function BoardHeader({ board, columns, takenPrefixes }: IProps) {
  const [sheet, setSheet] = useState<SheetName | null>(null)
  const tokens = useTokens()

  const { mutate: rename } = useRenameDashboard()
  const { mutate: setPrefix } = useUpdateDashboardPrefix()
  const { mutate: deleteDashboard } = useDeleteDashboard()
  const { mutate: moveColumn } = useMoveColumn(board.id)

  // The field is a draft until it commits, but a rename arriving from sync — or
  // a switch to another board — has to replace what is sitting in it.
  const [draft, setDraft] = useState(board.title)
  const [committed, setCommitted] = useState(board.title)
  if (board.title !== committed) {
    setCommitted(board.title)
    setDraft(board.title)
  }

  function commitTitle() {
    const next = draft.trim()
    if (!next || next === board.title) {
      setDraft(board.title)
      return
    }
    rename({ id: board.id, name: next })
  }

  const close = () => setSheet(null)

  return (
    <>
      <ScreenHeader>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onBlur={commitTitle}
          onSubmitEditing={commitTitle}
          returnKeyType="done"
          accessibilityLabel="Board name"
          placeholder="Untitled board"
          placeholderTextColor={tokens.mutedForeground}
          className="flex-1 px-1 text-base font-sans-semibold text-sidebar-foreground"
        />
        <Pressable
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Board actions"
          onPress={() => setSheet("actions")}
          className="rounded-lg p-1.5 active:bg-muted"
        >
          <MoreHorizontal size={20} color={tokens.mutedForeground} />
        </Pressable>
      </ScreenHeader>

      <Sheet open={sheet !== null} onClose={close}>
        {sheet === "actions" && (
          <View>
            <SheetItem
              icon={Hash}
              label="Card prefix"
              trailing={board.prefix ?? ""}
              onPress={() => setSheet("prefix")}
            />
            <SheetItem
              icon={ArrowRightLeft}
              label="Reorder columns"
              disabled={columns.length < 2}
              onPress={() => setSheet("reorder")}
            />
            <View className="my-1 h-px bg-border" />
            <SheetItem
              icon={Trash2}
              label="Delete board"
              destructive
              onPress={() => setSheet("delete")}
            />
          </View>
        )}

        {sheet === "prefix" && (
          <PrefixForm
            prefix={board.prefix ?? ""}
            taken={takenPrefixes}
            onCommit={(prefix) => setPrefix({ id: board.id, prefix })}
            onClose={close}
          />
        )}

        {sheet === "reorder" && (
          <ReorderColumns
            columns={columns}
            onReorder={(changed) => moveColumn(changed)}
            onClose={close}
          />
        )}

        {sheet === "delete" && (
          <ConfirmBody
            title="Delete board?"
            description={`"${board.title}" and all of its columns and cards move to the trash, where they stay restorable for 14 days.`}
            confirmLabel="Delete board"
            onConfirm={() => deleteDashboard(board.id)}
            onClose={close}
          />
        )}
      </Sheet>
    </>
  )
}
