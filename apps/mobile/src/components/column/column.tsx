import type { CardPatch } from "@doska/core/mutations"
import type { Card, Column as ColumnType } from "@doska/core/types"
import { Text } from "@doska/ui-kit-mobile"
import { memo, useCallback, useMemo } from "react"
import { Pressable, RefreshControl, View } from "react-native"
import Animated, { useAnimatedRef } from "react-native-reanimated"
import Sortable, {
  type SortableGridDragEndParams,
  type SortableGridRenderItem,
} from "react-native-sortables"
import { BoardCard } from "@/components/card/board-card"
import { ColumnHead } from "./column-head"
import {
  CARD_GAP,
  useCardGeometry,
} from "@/components/board/drag/card-geometry"
import { DragTilt } from "@/components/board/drag/drag-tilt"
import { useSyncRefresh } from "@/lib/use-sync-refresh"

/** Held this long without moving, a card lifts instead of the list scrolling. */
const PICKUP_MS = 250

// borderWidth has to be zeroed explicitly: the library merges this over its
// defaults key by key, so an omitted key keeps the default dashed outline.
const DROP_SLOT = {
  backgroundColor: "rgba(0, 0, 0, 0.1)",
  borderRadius: 12,
  borderWidth: 0,
  flex: 1,
} as const

/**
 * The gap a card carried in from another column would land in. It rides in the
 * grid's data so the sortable lays it out, which is what makes the cards below
 * it slide apart instead of the slot being painted over them.
 */
type Slot = { type: "card"; card: Card } | { type: "gap"; height: number }

const GAP_KEY = "__gap__"

/**
 * Strips the gap back out before the drop is reported. A column only ever shows
 * a gap for a card coming from elsewhere, so a drop that ends here has no gap
 * to account for; the index is still corrected in case that ever changes.
 */
function unwrap(
  params: SortableGridDragEndParams<Slot>
): SortableGridDragEndParams<Card> {
  const before = params.data
    .slice(0, params.toIndex)
    .filter((slot) => slot.type === "gap").length
  return {
    ...params,
    data: params.data
      .filter((slot) => slot.type === "card")
      .map((slot) => slot.card),
    toIndex: params.toIndex - before,
  }
}

interface IProps {
  deckId: string
  column: ColumnType
  cards: Card[]
  /** Where to open the gap, or null for no gap in this column. */
  gapIndex?: number | null
  gapHeight?: number
  width: number
  onToggleBody: (columnId: string, showBody: boolean) => void
  onAddCard: (columnId: string) => void
  onPatchCard: (id: string, patch: CardPatch) => void
  onDragStart: (columnId: string, cardId: string) => void
  onDragEnd: (columnId: string, params: SortableGridDragEndParams<Card>) => void
}

/**
 * One column, sized to the screen so the board pages between them — the same
 * shape the web takes below its `md` breakpoint.
 */
export const Column = memo(function Column({
  deckId,
  column,
  cards,
  gapIndex = null,
  gapHeight = 0,
  width,
  onToggleBody,
  onAddCard,
  onPatchCard,
  onDragStart,
  onDragEnd,
}: IProps) {
  const showBody = !column.collapsed
  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const { registerList, registerHeight } = useCardGeometry()
  const { refreshing, onRefresh } = useSyncRefresh([deckId])

  const slots = useMemo<Slot[]>(() => {
    const items: Slot[] = cards.map((card) => ({ type: "card", card }))
    if (gapIndex !== null) {
      items.splice(gapIndex, 0, { type: "gap", height: gapHeight })
    }
    return items
  }, [cards, gapIndex, gapHeight])

  const renderCard = useCallback<SortableGridRenderItem<Slot>>(
    ({ item }) =>
      item.type === "gap" ? (
        <View style={{ height: item.height }}>
          <View style={DROP_SLOT} />
        </View>
      ) : (
        <DragTilt
          onLayout={(event) =>
            registerHeight(
              column.id,
              item.card.id,
              event.nativeEvent.layout.height
            )
          }
        >
          <BoardCard
            card={item.card}
            deckId={deckId}
            showBody={showBody}
            done={column.done}
            onPatch={onPatchCard}
          />
        </DragTilt>
      ),
    [
      column.id,
      column.done,
      deckId,
      showBody,
      registerHeight,
      onPatchCard,
    ]
  )

  return (
    <View className="flex-1 bg-background" style={{ width }}>
      <ColumnHead
        column={column}
        showBody={showBody}
        onToggleBody={() => onToggleBody(column.id, showBody)}
      />

      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="grow px-3 pb-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Pressable
          onPress={() => onAddCard(column.id)}
          className="mb-3 h-12 items-center justify-center rounded-xl border border-card-ring bg-card active:opacity-70"
        >
          <Text className="text-xl font-sans-medium text-muted-foreground">
            +
          </Text>
        </Pressable>
        <View ref={(list) => registerList(column.id, list)}>
          <Sortable.Grid
            columns={1}
            data={slots}
            keyExtractor={(slot) =>
              slot.type === "gap" ? GAP_KEY : slot.card.id
            }
            renderItem={renderCard}
            rowGap={CARD_GAP}
            dragActivationDelay={PICKUP_MS}
            scrollableRef={scrollRef}
            enableActiveItemSnap={false}
            activeItemScale={1}
            // A card carried in from another column is a new item here, and the
            // library's default entrance scales it up from half size — it reads
            // as the card growing rather than landing where it was dropped.
            itemEntering={null}
            hapticsEnabled
            showDropIndicator
            dropIndicatorStyle={DROP_SLOT}
            onDragStart={(params) => onDragStart(column.id, params.key)}
            onDragEnd={(params) => onDragEnd(column.id, unwrap(params))}
          />
        </View>
      </Animated.ScrollView>
    </View>
  )
})
