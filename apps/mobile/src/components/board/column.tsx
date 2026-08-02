import type { Card, Column as ColumnType } from "@doska/core/types"
import { BlurView } from "expo-blur"
import { useCallback } from "react"
import { Pressable, Text, View } from "react-native"
import Animated, { useAnimatedRef } from "react-native-reanimated"
import Sortable, {
  type SortableGridDragEndParams,
  type SortableGridRenderItem,
} from "react-native-sortables"
import { useTokens } from "@/lib/tokens"
import { BoardCard } from "./board-card"
import { ColumnSwatch } from "./column-swatch"
import { CARD_GAP, useCardGeometry } from "./drag/card-geometry"

/** Reserved as the scroller's top inset, since the head floats over it. */
const HEAD_HEIGHT = 60
/** Held this long without moving, a card lifts instead of the list scrolling. */
const PICKUP_MS = 250

interface IProps {
  column: ColumnType
  cards: Card[]
  prefix: string
  width: number
  onToggleBody: () => void
  onAddCard: () => void
  onDragStart: (columnId: string) => void
  onDragEnd: (columnId: string, params: SortableGridDragEndParams<Card>) => void
}

/**
 * One column, sized to the screen so the board pages between them — the same
 * shape the web takes below its `md` breakpoint.
 */
export function Column({
  column,
  cards,
  prefix,
  width,
  onToggleBody,
  onAddCard,
  onDragStart,
  onDragEnd,
}: IProps) {
  const { dark, headVeil } = useTokens()
  const showBody = !column.collapsed
  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const { registerList, registerHeight } = useCardGeometry()

  const renderCard = useCallback<SortableGridRenderItem<Card>>(
    ({ item }) => (
      <View
        onLayout={(event) =>
          registerHeight(column.id, item.id, event.nativeEvent.layout.height)
        }
      >
        <BoardCard
          card={item}
          prefix={prefix}
          showBody={showBody}
          done={column.done}
        />
      </View>
    ),
    [column.id, column.done, prefix, showBody, registerHeight]
  )

  return (
    <View style={{ width }} className="flex-1">
      {/* Cards scroll edge to edge and pass under the head, which is what its
          blur is there to catch. */}
      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="grow px-3 pb-6"
        contentContainerStyle={{ paddingTop: HEAD_HEIGHT }}
      >
        <View
          className="min-h-40 grow rounded-3xl border border-sidebar-primary-foreground bg-background p-4"
          // The well's recessed edge — part of the look, not a drop shadow, so
          // it has to be inset. Same values as the web column.
          style={{
            boxShadow: dark
              ? "inset 0 1px 3px rgba(0, 0, 0, 0.4)"
              : "inset 0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Pressable
            onPress={onAddCard}
            className="mb-3 h-8 items-center justify-center rounded-lg bg-button-muted active:opacity-70"
          >
            <Text className="text-base font-sans-medium text-muted-foreground">
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
        </View>
      </Animated.ScrollView>

      {/* The web's `sticky top-0` head: `bg-background/80 backdrop-blur-xs`. */}
      <BlurView
        intensity={20}
        tint={dark ? "dark" : "light"}
        // Styled by value, not by class: NativeWind only rewrites `className`
        // on React Native's own components, and BlurView is not one.
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: HEAD_HEIGHT,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          paddingHorizontal: 12,
          backgroundColor: headVeil,
        }}
      >
        <View className="flex-1 flex-row items-center gap-1.5">
          <ColumnSwatch color={column.color} />
          <Text
            numberOfLines={1}
            className="text-base font-sans-medium uppercase text-muted-foreground"
          >
            {column.title}
          </Text>
        </View>
        <Pressable onPress={onToggleBody} hitSlop={10}>
          <Text className="text-[13px] font-sans-medium text-muted-foreground">
            {showBody ? "Hide body" : "Show body"}
          </Text>
        </Pressable>
      </BlurView>
    </View>
  )
}
