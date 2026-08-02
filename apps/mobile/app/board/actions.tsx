import { useBoard } from "@doska/core/queries"
import type { Dashboard } from "@doska/core/types"
import { Separator, SheetItem, SheetScreen } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import { ArrowRightLeft, Hash, Trash2 } from "lucide-react-native"
import { View } from "react-native"
import { useActiveBoard } from "@/lib/use-active-board"

/** The board actions the web keeps behind its `⋯` menu. Each one pushes another
 * sheet, which iOS stacks over this one and Android replaces. */
function Actions({ board }: { board: Dashboard }) {
  const { data } = useBoard(board.id)
  const columns = data?.columns ?? []

  return (
    <SheetScreen>
      <View>
        <SheetItem
          icon={Hash}
          label="Card prefix"
          trailing={board.prefix ?? ""}
          onPress={() => router.push("/board/prefix")}
        />
        <SheetItem
          icon={ArrowRightLeft}
          label="Reorder columns"
          disabled={columns.length < 2}
          onPress={() => router.push("/board/reorder")}
        />
        <Separator className="my-1" />
        <SheetItem
          icon={Trash2}
          label="Delete board"
          destructive
          onPress={() => router.push("/board/delete")}
        />
      </View>
    </SheetScreen>
  )
}

export default function BoardActionsSheet() {
  const { board } = useActiveBoard()
  if (!board) return null
  return <Actions board={board} />
}
