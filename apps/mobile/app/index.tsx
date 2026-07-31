import type { Card, Column } from "@doska/core/types"
import { useBoard, useDashboards } from "@doska/core/queries"
import { byPosition } from "@doska/core/utils"
import { ActivityIndicator, ScrollView, Text, View } from "react-native"

function CardRow({ card }: { card: Card }) {
  return (
    <View className="gap-1 rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
      <Text className="text-[15px] font-medium text-neutral-900 dark:text-neutral-100">
        {card.title}
      </Text>
      {card.body ? (
        <Text
          className="text-[13px] leading-[18px] text-neutral-500 dark:text-neutral-400"
          numberOfLines={3}
        >
          {card.body}
        </Text>
      ) : null}
      {card.deadline ? (
        <Text className="text-xs text-neutral-400">{card.deadline}</Text>
      ) : null}
    </View>
  )
}

function ColumnView({ column, cards }: { column: Column; cards: Card[] }) {
  return (
    <View className="w-72 flex-1">
      <Text className="mb-2 text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
        {column.title} <Text className="font-normal text-neutral-400">{cards.length}</Text>
      </Text>
      <ScrollView contentContainerClassName="gap-2 pb-6">
        {cards.map((card) => (
          <CardRow key={card.id} card={card} />
        ))}
      </ScrollView>
    </View>
  )
}

export default function BoardScreen() {
  const { data: dashboards } = useDashboards()
  const deckId = dashboards?.[0]?.id
  const { data: board } = useBoard(deckId ?? "")

  if (!dashboards || !board) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-950">
        <ActivityIndicator />
      </View>
    )
  }

  if (board.columns.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-950">
        <Text className="text-neutral-500">No columns yet.</Text>
      </View>
    )
  }

  return (
    <ScrollView
      horizontal
      className="bg-neutral-50 dark:bg-neutral-950"
      contentContainerClassName="gap-3 p-3"
    >
      {board.columns.map((column) => (
        <ColumnView
          key={column.id}
          column={column}
          cards={board.cards
            .filter((card) => card.columnId === column.id)
            .sort(byPosition)}
        />
      ))}
    </ScrollView>
  )
}
