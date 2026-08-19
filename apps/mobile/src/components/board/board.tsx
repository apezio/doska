import type { Dashboard } from "@doska/core/types"
import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Sortable from "react-native-sortables"
import { BoardHeader } from "@/components/board/board-header"
import { ColumnPager } from "@/components/column/column-pager"
import { CardGeometryProvider } from "@/components/board/drag/card-geometry-provider"
import { SyncIndicator } from "@/components/shell/sync-indicator"

interface IProps {
  board: Dashboard
}

export function Board({ board }: IProps) {
  const insets = useSafeAreaInsets()

  return (
    // The portal lifts the dragged card out of its column's scroller, the only
    // way it can be carried to another column.
    <Sortable.PortalProvider key={board.id}>
      <CardGeometryProvider>
        <BoardHeader board={board} />
        <View className="relative min-h-0 flex-1">
          <ColumnPager board={board} />
          <View
            style={{ bottom: insets.bottom + 16 }}
            className="absolute right-4 z-50"
          >
            <SyncIndicator />
          </View>
        </View>
      </CardGeometryProvider>
    </Sortable.PortalProvider>
  )
}
