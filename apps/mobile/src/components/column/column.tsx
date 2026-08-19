import type { CardPatch } from "@doska/core/mutations"
import type { Card, Column as ColumnType } from "@doska/core/types"
import { memo, useCallback } from "react"
import { Pressable, RefreshControl, Text, View } from "react-native"
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
import { useSyncRefresh } from "@/lib/use-sync-refresh"

/** Held this long without moving, a card lifts instead of the list scrolling. */
const PICKUP_MS = 250

interface IProps {
  deckId: string
  column: ColumnType
  cards: Card[]
  prefix: string
  width: number
  onToggleBody: (columnId: string, showBody: boolean) => void
  onAddCard: (columnId: string) => void
  onPatchCard: (id: string, patch: CardPatch) => void
  onDragStart: (columnId: string) => void
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
  prefix,
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

  const renderCard = useCallback<SortableGridRenderItem<Card>>(
    ({ item }) => (
      <View
        onLayout={(event) =>
          registerHeight(column.id, item.id, event.nativeEvent.layout.height)
        }
      >
        <BoardCard
          card={item}
          deckId={deckId}
          prefix={prefix}
          showBody={showBody}
          done={column.done}
          onPatch={onPatchCard}
        />
      </View>
    ),
    [
      column.id,
      column.done,
      deckId,
      prefix,
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
            data={cards}
            keyExtractor={(card) => card.id}
            renderItem={renderCard}
            rowGap={CARD_GAP}
            dragActivationDelay={PICKUP_MS}
            // Its own scroller, so a card held at the top or bottom can
            // reach a drop site that is off-screen.
            scrollableRef={scrollRef}
            // A card is nearly as wide as the screen, so snapping its centre
            // under the finger throws it sideways as it lifts.
            enableActiveItemSnap={false}
            hapticsEnabled
            showDropIndicator
            onDragStart={() => onDragStart(column.id)}
            onDragEnd={(params) => onDragEnd(column.id, params)}
          />
        </View>
      </Animated.ScrollView>
    </View>
  )
})
