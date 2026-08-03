import type { Dashboard } from "@doska/core/types"
import Sortable from "react-native-sortables"
import { BoardHeader } from "@/components/board/board-header"
import { ColumnPager } from "@/components/column/column-pager"
import { CardGeometryProvider } from "@/components/board/drag/card-geometry-provider"

interface IProps {
  board: Dashboard
}

export function Board({ board }: IProps) {
  return (
    // The portal lifts the dragged card out of its column's scroller, the only
    // way it can be carried to another column.
    <Sortable.PortalProvider key={board.id}>
      <CardGeometryProvider>
        <BoardHeader board={board} />
        <ColumnPager board={board} />
      </CardGeometryProvider>
    </Sortable.PortalProvider>
  )
}
