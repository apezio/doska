import { setBoardView, useBoardView } from "@doska/core/board-view"
import type { Dashboard } from "@doska/core/types"
import { IconButton, Text } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import Columns3 from "lucide-react-native/icons/columns-3"
import MoreHorizontal from "lucide-react-native/icons/ellipsis"
import Rows3 from "lucide-react-native/icons/rows-3"
import { Pressable } from "react-native"
import { ScreenHeader } from "@/components/shell/screen-header"
import { ROUTES } from "@/lib/routes"

interface IProps {
  board: Dashboard
}

export function BoardHeader({ board }: IProps) {
  const view = useBoardView(board.id)
  const isRows = view === "rows"

  return (
    <ScreenHeader>
      <Pressable
        onPress={() => router.push(ROUTES.boardRename)}
        accessibilityRole="button"
        accessibilityLabel={`Rename ${board.title}`}
        className="min-w-0 flex-1 active:opacity-40"
      >
        <Text
          numberOfLines={1}
          className="px-1 text-base font-sans-semibold text-sidebar-foreground"
        >
          {board.title}
        </Text>
      </Pressable>
      <IconButton
        icon={isRows ? Columns3 : Rows3}
        label={isRows ? "Show columns" : "Show rows"}
        onPress={() => setBoardView(board.id, isRows ? "board" : "rows")}
      />
      <IconButton
        icon={MoreHorizontal}
        label="Board actions"
        onPress={() => router.push(ROUTES.boardActions)}
      />
    </ScreenHeader>
  )
}
