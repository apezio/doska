import {
  useCreateCard,
  useCreateDashboard,
  useSetColumnCollapsed,
} from "@doska/core/mutations"
import { useBoard } from "@doska/core/queries"
import { sync } from "@doska/core/sync"
import type { Dashboard } from "@doska/core/types"
import { byPosition } from "@doska/core/utils"
import { useFocusEffect } from "expo-router"
import { useCallback } from "react"
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native"
import { BoardHeader } from "@/components/board/board-header"
import { Column } from "@/components/board/column"
import { ScreenHeader } from "@/components/ui/screen-header"
import { selectBoard, useActiveBoard } from "@/lib/use-active-board"

function Board({
  board: dashboard,
  takenPrefixes,
}: {
  board: Dashboard
  takenPrefixes: string[]
}) {
  const deckId = dashboard.id
  const { data: board } = useBoard(deckId)
  const { mutate: setColumnCollapsed } = useSetColumnCollapsed(deckId)
  const { mutate: createCard } = useCreateCard(deckId)
  const { width } = useWindowDimensions()

  return (
    <>
      <BoardHeader
        board={dashboard}
        columns={board?.columns ?? []}
        takenPrefixes={takenPrefixes}
      />
      {!board ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : board.columns.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">No columns yet.</Text>
        </View>
      ) : (
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
            />
          ))}
        </ScrollView>
      )}
    </>
  )
}

export default function BoardScreen() {
  const { dashboards, board, deckId, isPending } = useActiveBoard()
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
        <Board
          key={board.id}
          board={board}
          takenPrefixes={dashboards
            .filter((one) => one.id !== board.id)
            .map((one) => one.prefix ?? "")}
        />
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
