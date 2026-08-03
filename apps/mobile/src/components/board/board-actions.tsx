import { useBoard } from "@doska/core/queries"
import type { Dashboard } from "@doska/core/types"
import { Separator, SheetItem } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import ArrowRightLeft from "lucide-react-native/icons/arrow-right-left"
import Hash from "lucide-react-native/icons/hash"
import Plus from "lucide-react-native/icons/plus"
import Trash2 from "lucide-react-native/icons/trash-2"
import { View } from "react-native"
import { ROUTES } from "@/lib/routes"

interface IProps {
  board: Dashboard
}

/** The board actions the web keeps behind its `⋯` menu. */
export function BoardActions({ board }: IProps) {
  const { data } = useBoard(board.id)
  const columns = data?.columns ?? []

  return (
    <View>
      <SheetItem
        icon={Hash}
        label="Card prefix"
        trailing={board.prefix ?? ""}
        onPress={() => router.push(ROUTES.boardPrefix)}
      />
      {/* The web's trailing "+" column, which a one-column-per-screen board has
          nowhere to put. */}
      <SheetItem
        icon={Plus}
        label="Add column"
        onPress={() => router.push(ROUTES.columnNew)}
      />
      <SheetItem
        icon={ArrowRightLeft}
        label="Reorder columns"
        disabled={columns.length < 2}
        onPress={() => router.push(ROUTES.boardReorder)}
      />
      <Separator className="my-1" />
      <SheetItem
        icon={Trash2}
        label="Delete board"
        destructive
        onPress={() => router.push(ROUTES.boardDelete)}
      />
    </View>
  )
}
