import type { Dashboard } from "@doska/core/types"
import { IconButton } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import MoreHorizontal from "lucide-react-native/icons/ellipsis"
import { Pressable, Text } from "react-native"
import { ScreenHeader } from "@/components/shell/screen-header"
import { ROUTES } from "@/lib/routes"

interface IProps {
  board: Dashboard
}

export function BoardHeader({ board }: IProps) {
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
        icon={MoreHorizontal}
        label="Board actions"
        onPress={() => router.push(ROUTES.boardActions)}
      />
    </ScreenHeader>
  )
}
