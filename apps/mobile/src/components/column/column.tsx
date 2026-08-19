import type { CardPatch } from "@doska/core/mutations"
import type { Card, Column as ColumnType } from "@doska/core/types"
import { Text } from "@doska/ui-kit-mobile"
import { memo, useCallback } from "react"
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
      <DragTilt
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
      </DragTilt>
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
            scrollableRef={scrollRef}
            enableActiveItemSnap={false}
            activeItemScale={1}
            hapticsEnabled
            showDropIndicator
            dropIndicatorStyle={DROP_SLOT}
            onDragStart={() => onDragStart(column.id)}
            onDragEnd={(params) => onDragEnd(column.id, params)}
          />
        </View>
      </Animated.ScrollView>
    </View>
  )
})
