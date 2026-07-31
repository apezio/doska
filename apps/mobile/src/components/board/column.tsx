import type { Card, Column as ColumnType } from "@doska/core/types"
import { BlurView } from "expo-blur"
import { Pressable, ScrollView, Text, View } from "react-native"
import { useTokens } from "@/lib/tokens"
import { BoardCard } from "./board-card"
import { ColumnSwatch } from "./column-swatch"

/** Reserved as the scroller's top inset, since the head floats over it. */
const HEAD_HEIGHT = 60

interface IProps {
  column: ColumnType
  cards: Card[]
  prefix: string
  width: number
  onToggleBody: () => void
  onAddCard: () => void
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
}: IProps) {
  const { dark, headVeil } = useTokens()
  const showBody = !column.collapsed

  return (
    <View style={{ width }} className="flex-1">
      {/* Cards scroll edge to edge and pass under the head, which is what its
          blur is there to catch. */}
      <ScrollView
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
          {cards.map((card) => (
            <BoardCard
              key={card.id}
              card={card}
              prefix={prefix}
              showBody={showBody}
              done={column.done}
            />
          ))}
        </View>
      </ScrollView>

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
