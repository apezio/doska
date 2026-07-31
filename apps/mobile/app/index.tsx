import { useCreateCard, useSetColumnCollapsed } from "@doska/core/mutations"
import { useBoard } from "@doska/core/queries"
import { sync } from "@doska/core/sync"
import { byPosition } from "@doska/core/utils"
import { useEffect } from "react"
import {
  ActivityIndicator,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native"
import { BoardHeader } from "@/components/board/board-header"
import { Column } from "@/components/board/column"
import { useActiveBoard } from "@/lib/use-active-board"

function BoardBody({ deckId, prefix }: { deckId: string; prefix: string }) {
  const { data: board } = useBoard(deckId)
  const { mutate: setColumnCollapsed } = useSetColumnCollapsed(deckId)
  const { mutate: createCard } = useCreateCard(deckId)
  const { width } = useWindowDimensions()

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
        <Text className="text-muted-foreground">No columns yet.</Text>
      </View>
    )
  }

  return (
    <ScrollView
      horizontal
      // One column per screen, settling on a column edge rather than mid-swipe.
      snapToInterval={width}
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
    >
      {[...board.columns].sort(byPosition).map((column) => (
        <Column
          key={column.id}
          column={column}
          width={width}
          prefix={prefix}
          cards={board.cards
            .filter((card) => card.columnId === column.id)
            .sort(byPosition)}
          onToggleBody={() =>
            setColumnCollapsed({ id: column.id, collapsed: !column.collapsed })
          }
          onAddCard={() => createCard(column.id)}
        />
      ))}
    </ScrollView>
  )
}

export default function BoardScreen() {
  const { dashboards, deckId, select } = useActiveBoard()
  const active = dashboards.find((dashboard) => dashboard.id === deckId)

  // Only the active board is pulled during normal use, so background sync has
  // to be told which one that is.
  useEffect(() => {
    sync.setActiveBoard(deckId)
  }, [deckId])

  return (
    <View className="flex-1 bg-sidebar">
      <BoardHeader
        dashboards={dashboards}
        deckId={deckId}
        onSelect={select}
      />
      {deckId ? (
        <BoardBody deckId={deckId} prefix={active?.prefix ?? ""} />
      ) : (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      )}
    </View>
  )
}
