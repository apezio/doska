import {
  useCreateCard,
  useCreateDashboard,
  useMoveCard,
  useSetColumnCollapsed,
} from "@doska/core/mutations"
import { useBoard } from "@doska/core/queries"
import { sync } from "@doska/core/sync"
import type { Card, Dashboard } from "@doska/core/types"
import { byPosition } from "@doska/core/utils"
import { useFocusEffect } from "expo-router"
import { generateKeyBetween } from "fractional-indexing"
import { useCallback, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native"
import Animated from "react-native-reanimated"
import Sortable, {
  type SortableGridDragEndParams,
} from "react-native-sortables"
import { BoardHeader } from "@/components/board/board-header"
import { Column } from "@/components/board/column"
import { useCardGeometry } from "@/components/board/drag/card-geometry"
import { CardGeometryProvider } from "@/components/board/drag/card-geometry-provider"
import { useDropPoint } from "@/components/board/drag/use-drop-point"
import { useEdgePaging } from "@/components/board/drag/use-edge-paging"
import { ScreenHeader } from "@/components/ui/screen-header"
import { selectBoard, useActiveBoard } from "@/lib/use-active-board"

/**
 * The key for a card dropped between `before` and `after`, or null if there is
 * no room for one. `generateKeyBetween` throws when the two neighbours carry
 * the same position, which should not happen and yet does — and because the
 * drop handler is async, the throw surfaces only as an unhandled rejection
 * reading `Error:  >= `. Named here instead, with the cards that collided.
 */
function keyBetween(before?: Card, after?: Card): string | null {
  try {
    return generateKeyBetween(before?.position ?? null, after?.position ?? null)
  } catch {
    console.warn(
      `[board] no key between ${before?.id}@${before?.position} and ${after?.id}@${after?.position} — drop ignored`
    )
    return null
  }
}

function Board({ board: dashboard }: { board: Dashboard }) {
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

      // A key minted strictly between the drop site's neighbours, as on the
      // web: only the moved card is written, so a reorder someone else is
      // making at the same time never collides with this one.
      const position = keyBetween(neighbours[0], neighbours[1])
      if (!position) return

      moveCard([{ ...moved, columnId: toColumnId, position }])
    },
    [board, columnIds, dropPoint, heightOf, moveCard, page, resolveDropIndex]
  )

  return (
    <>
      <BoardHeader board={dashboard} />
      {!board ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : columns.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">No columns yet.</Text>
        </View>
      ) : (
        <Animated.ScrollView
          ref={pagerRef}
          horizontal
          // One column per screen, settling on a column edge rather than mid-swipe.
          snapToInterval={width}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          // A lifted card pages the board by dwelling at an edge; a swipe at
          // the same time would fight it.
          scrollEnabled={!dragging}
          onScroll={onPagerScroll}
          scrollEventThrottle={16}
        >
          {columns.map((column) => (
            <Column
              key={column.id}
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
      )}
    </>
  )
}

export default function BoardScreen() {
  const { board, deckId, isPending } = useActiveBoard()
  const { mutate: createDashboard } = useCreateDashboard()

  // Only the active board is pulled during normal use, so background sync has
  // to be told which one that is. On focus rather than on mount: the drawer
  // keeps every screen mounted, and the trash clears this on its way in.
  useFocusEffect(
    useCallback(() => {
      sync.setActiveBoard(deckId)
    }, [deckId])
  )

  return (
    <View className="flex-1 bg-sidebar">
      {board ? (
        // The portal lifts the dragged card out of its column's scroller, which
        // is the only way it can be carried to another column.
        <Sortable.PortalProvider key={board.id}>
          <CardGeometryProvider>
            <Board board={board} />
          </CardGeometryProvider>
        </Sortable.PortalProvider>
      ) : (
        <>
          <ScreenHeader />
          <View className="flex-1 items-center justify-center gap-3 px-8">
            {isPending ? (
              <ActivityIndicator />
            ) : (
              <>
                <Text className="text-center text-muted-foreground">
                  No boards yet.
                </Text>
                <Pressable
                  onPress={() =>
                    createDashboard("Untitled board", {
                      onSuccess: (created) => selectBoard(created.id),
                    })
                  }
                  className="rounded-xl bg-primary px-4 py-3 active:opacity-80"
                >
                  <Text className="text-[15px] font-sans-medium text-primary-foreground">
                    Add a dashboard
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </>
      )}
    </View>
  )
}
