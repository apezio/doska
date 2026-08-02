import { useRenameDashboard } from "@doska/core/mutations"
import type { Dashboard } from "@doska/core/types"
import { router } from "expo-router"
import { MoreHorizontal } from "lucide-react-native"
import { useState } from "react"
import { Pressable, TextInput } from "react-native"
import { ScreenHeader } from "@/components/ui/screen-header"
import { useTokens } from "@/lib/tokens"

interface IProps {
  board: Dashboard
}

/** The board's top bar: the drawer toggle, the editable board name, and the
 * actions the web keeps behind its `⋯` menu — here a sheet route. */
export function BoardHeader({ board }: IProps) {
  const tokens = useTokens()

  const { mutate: rename } = useRenameDashboard()

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

  return (
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
        onPress={() => router.push("/board/actions")}
        className="rounded-lg p-1.5 active:bg-muted"
      >
        <MoreHorizontal size={20} color={tokens.mutedForeground} />
      </Pressable>
    </ScreenHeader>
  )
}
