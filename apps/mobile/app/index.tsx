import type { Card, Column, Dashboard } from "@doska/core/types"
import { useBoard } from "@doska/core/queries"
import { sync } from "@doska/core/sync"
import { byPosition } from "@doska/core/utils"
import { useEffect } from "react"
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native"
import { useActiveBoard } from "@/lib/use-active-board"

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
        {column.title}{" "}
        <Text className="font-normal text-neutral-400">{cards.length}</Text>
      </Text>
      <ScrollView contentContainerClassName="gap-2 pb-6">
        {cards.map((card) => (
          <CardRow key={card.id} card={card} />
        ))}
      </ScrollView>
    </View>
  )
}

function BoardPicker({
  dashboards,
  deckId,
  onSelect,
}: {
  dashboards: Dashboard[]
  deckId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="max-h-12 grow-0 border-b border-neutral-200 dark:border-neutral-800"
      contentContainerClassName="items-center gap-2 px-3 py-2"
    >
      {dashboards.map((dashboard) => (
        <Pressable
          key={dashboard.id}
          onPress={() => onSelect(dashboard.id)}
          className={
            dashboard.id === deckId
              ? "rounded-full bg-blue-600 px-3 py-1.5"
              : "rounded-full bg-neutral-200 px-3 py-1.5 dark:bg-neutral-800"
          }
        >
          <Text
            className={
              dashboard.id === deckId
                ? "text-[13px] font-medium text-white"
                : "text-[13px] font-medium text-neutral-700 dark:text-neutral-300"
            }
          >
            {dashboard.title}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  )
}

function BoardBody({ deckId }: { deckId: string }) {
  const { data: board } = useBoard(deckId)

  if (!board) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    )
  }

  if (board.columns.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-neutral-500">No columns yet.</Text>
      </View>
    )
  }

  return (
    <ScrollView horizontal contentContainerClassName="gap-3 p-3">
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

export default function BoardScreen() {
  const { dashboards, deckId, select } = useActiveBoard()

  // Only the active board is pulled during normal use, so background sync has
  // to be told which one that is.
  useEffect(() => {
    sync.setActiveBoard(deckId)
  }, [deckId])

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      {dashboards.length > 1 && (
        <BoardPicker
          dashboards={dashboards}
          deckId={deckId}
          onSelect={select}
        />
      )}
      {deckId ? (
        <BoardBody deckId={deckId} />
      ) : (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      )}
    </View>
  )
}
