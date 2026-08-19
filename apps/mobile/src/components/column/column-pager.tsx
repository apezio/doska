import {
  useCreateCard,
  useMoveCard,
  useSaveCard,
  useSetColumnCollapsed,
  type CardPatch,
} from "@doska/core/mutations"
import { useBoard } from "@doska/core/queries"
import type { Card, Dashboard } from "@doska/core/types"
import { useLandingSlot } from "@doska/core/landing-slot"
import {
  dropNeighbours,
  groupCardsByColumn,
  keyBetween,
  sortCards,
} from "@doska/core/utils"
import { EmptyState, Spinner } from "@doska/ui-kit-mobile"
import { useCallback, useMemo, useState } from "react"
import {
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native"
import Animated from "react-native-reanimated"
import type { SortableGridDragEndParams } from "react-native-sortables"
import { Column } from "@/components/column/column"
import { useCardGeometry } from "@/components/board/drag/card-geometry"
import { useDropPoint } from "@/components/board/drag/use-drop-point"
import { useEdgePaging } from "@/components/board/drag/use-edge-paging"

/** The sortable's own drop animation, `dropAnimationDuration`. */
const DROP_ANIMATION_MS = 300

/**
 * How many columns either side of the open one stay mounted. Every card renders
 * its own markdown, so mounting a whole board at once is what makes switching
 * boards stall; a placeholder of the same width keeps the pager's snapping and
 * scroll extent intact. One either side is also what the drag needs: a card
 * only ever lands on the open page, which is never a placeholder.
 */
const MOUNT_WINDOW = 1

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
  const { mutate: saveCard } = useSaveCard()
  const { width } = useWindowDimensions()
  const sort = useMemo(() => dashboard.sort ?? [], [dashboard.sort])
  const { hold, place } = useLandingSlot(sort.length > 0, DROP_ANIMATION_MS)

  // Memoised so that a re-render which leaves the board alone — picking a card
  // up is one — hands every column the array it already has, and the columns
  // below skip. `place` passes its input through when no card is landing there.
  const grouped = useMemo(
    () =>
      board
        ? groupCardsByColumn(board).map(({ column, cards }) => ({
            column,
            cards: sortCards(cards, sort),
          }))
        : [],
    [board, sort]
  )

  const columnIds = useMemo(
    () => grouped.map(({ column }) => column.id),
    [grouped]
  )
  const { pagerRef, onPagerScroll, page } = useEdgePaging(columnIds, width)
  const [openPage, setOpenPage] = useState(0)
  const dropPoint = useDropPoint()
  const { heightOf, resolveDropIndex } = useCardGeometry()
  const [dragging, setDragging] = useState(false)

  const patchCard = useCallback(
    (cardId: string, patch: CardPatch) => saveCard({ id: cardId, patch }),
    [saveCard]
  )

  const toggleBody = useCallback(
    (columnId: string, showBody: boolean) =>
      setColumnCollapsed({ id: columnId, collapsed: showBody }),
    [setColumnCollapsed]
  )

  const addCard = useCallback(
    (columnId: string) => createCard(columnId),
    [createCard]
  )

  const handleDragStart = useCallback(() => setDragging(true), [])

  const handlePagerScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      onPagerScroll(event)
      if (width > 0) {
        setOpenPage(Math.round(event.nativeEvent.contentOffset.x / width))
      }
    },
    [onPagerScroll, width]
  )

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
      let between: [Card | undefined, Card | undefined]

      if (toColumnId === fromColumnId) {
        if (params.toIndex === params.fromIndex) return
        // The card sits at `toIndex` in the new order, so it is skipped over.
        const order = params.data.filter((card) => card.id !== moved.id)
        between = dropNeighbours(order, params.toIndex, moved, sort)
        hold({ cardId: moved.id, columnId: toColumnId, index: params.toIndex })
      } else {
        const order =
          grouped.find(({ column }) => column.id === toColumnId)?.cards ?? []
        const index = await resolveDropIndex(
          toColumnId,
          order.map((card) => card.id),
          // The card's middle, not its top edge, or every drop reads low.
          dropPoint.current.y + heightOf(fromColumnId, moved.id) / 2
        )
        between = dropNeighbours(order, index, moved, sort)
        hold({ cardId: moved.id, columnId: toColumnId, index })
      }

      // Only the moved card is written, so a reorder someone else is making at
      // the same time never collides with this one.
      const position = keyBetween(between[0], between[1])
      if (!position) return

      moveCard([{ ...moved, columnId: toColumnId, position }])
    },
    [
      board,
      columnIds,
      dropPoint,
      grouped,
      heightOf,
      hold,
      moveCard,
      page,
      resolveDropIndex,
      sort,
    ]
  )

  if (!board) return <Spinner />

  if (grouped.length === 0) {
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
      onScroll={handlePagerScroll}
      scrollEventThrottle={16}
    >
      {grouped.map(({ column, cards }, index) =>
        Math.abs(index - openPage) > MOUNT_WINDOW ? (
          <View key={column.id} style={{ width }} />
        ) : (
          <Column
            key={column.id}
            deckId={deckId}
            column={column}
            width={width}
            prefix={dashboard.prefix ?? ""}
            cards={place(cards, column.id)}
            onToggleBody={toggleBody}
            onAddCard={addCard}
            onPatchCard={patchCard}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        )
      )}
    </Animated.ScrollView>
  )
}
