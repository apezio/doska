import {
  useCreateCard,
  useMoveCard,
  useSetColumnCollapsed,
} from "@doska/core/mutations"
import { useBoard } from "@doska/core/queries"
import type { Card, Dashboard } from "@doska/core/types"
import { byPosition, keyBetween } from "@doska/core/utils"
import { EmptyState, Spinner } from "@doska/ui-kit-mobile"
import { useCallback, useMemo, useState } from "react"
import { useWindowDimensions } from "react-native"
import Animated from "react-native-reanimated"
import type { SortableGridDragEndParams } from "react-native-sortables"
import { Column } from "@/components/column/column"
import { useCardGeometry } from "@/components/board/drag/card-geometry"
import { useDropPoint } from "@/components/board/drag/use-drop-point"
import { useEdgePaging } from "@/components/board/drag/use-edge-paging"

interface IProps {
  board: Dashboard
}

/** The board's columns, one per screen, swiped or paged between. */
export function ColumnPager({ board: dashboard }: IProps) {
  const deckId = dashboard.id
  const { data: board } = useBoard(deckId)
  const { mutate: setColumnCollapsed } = useSetColumnCollapsed(deckId)
  const { mutate: createCard } = useCreateCard(deckId)
  const { mutate: moveCard } = useMoveCard(deckId)
  const { width } = useWindowDimensions()

  const columns = useMemo(
    () => [...(board?.columns ?? [])].sort(byPosition),
    [board?.columns]
  )
  const columnIds = useMemo(() => columns.map((one) => one.id), [columns])
  const { pagerRef, onPagerScroll, page } = useEdgePaging(columnIds, width)
  const dropPoint = useDropPoint()
  const { heightOf, resolveDropIndex } = useCardGeometry()
  const [dragging, setDragging] = useState(false)

  // A card lands wherever the board has been paged to, which is not the column
  // it was picked up in if it was carried across. The sortable only ever
  // reorders the column it belongs to, so the two cases part here: within a
  // column it has already worked the new order out, across columns nobody has.
  const handleDragEnd = useCallback(
    async (fromColumnId: string, params: SortableGridDragEndParams<Card>) => {
      setDragging(false)
      if (!board) return
      const moved = board.cards.find((card) => card.id === params.key)
      if (!moved) return

      const toColumnId = columnIds[page.current] ?? fromColumnId
      let neighbours: [Card | undefined, Card | undefined]

      if (toColumnId === fromColumnId) {
        if (params.toIndex === params.fromIndex) return
        // The card sits at `toIndex` in the new order, so it is skipped over.
        neighbours = [
          params.data[params.toIndex - 1],
          params.data[params.toIndex + 1],
        ]
      } else {
        const order = board.cards
          .filter((card) => card.columnId === toColumnId)
          .sort(byPosition)
        const index = await resolveDropIndex(
          toColumnId,
          order.map((card) => card.id),
          // The card's middle, not its top edge, or every drop reads low.
          dropPoint.current.y + heightOf(fromColumnId, moved.id) / 2
        )
        neighbours = [order[index - 1], order[index]]
      }

      // Only the moved card is written, so a reorder someone else is making at
      // the same time never collides with this one.
      const position = keyBetween(neighbours[0], neighbours[1])
      if (!position) return

      moveCard([{ ...moved, columnId: toColumnId, position }])
    },
    [board, columnIds, dropPoint, heightOf, moveCard, page, resolveDropIndex]
  )

  if (!board) return <Spinner />

  if (columns.length === 0) {
    return <EmptyState message="No columns yet." />
  }

  return (
    <Animated.ScrollView
      ref={pagerRef}
      horizontal
      // One column per screen, settling on a column edge rather than mid-swipe.
      snapToInterval={width}
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      // A lifted card pages the board by dwelling at an edge; a swipe at the
      // same time would fight it.
      scrollEnabled={!dragging}
      onScroll={onPagerScroll}
      scrollEventThrottle={16}
    >
      {columns.map((column) => (
        <Column
          key={column.id}
          deckId={deckId}
          column={column}
          width={width}
          prefix={dashboard.prefix ?? ""}
          cards={board.cards
            .filter((card) => card.columnId === column.id)
            .sort(byPosition)}
          onToggleBody={() =>
            setColumnCollapsed({
              id: column.id,
              collapsed: !column.collapsed,
            })
          }
          onAddCard={() => createCard(column.id)}
          onDragStart={() => setDragging(true)}
          onDragEnd={handleDragEnd}
        />
      ))}
    </Animated.ScrollView>
  )
}
