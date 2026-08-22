import { useMoveCardToColumn } from "@doska/core/mutations"
import type { DigestCard } from "@doska/core/operations"
import { taskProgress } from "@doska/markdown"
import { Checkbox, cn, PriorityDot, Text } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import { Pressable, View } from "react-native"
import { TaskCount } from "@/components/card/task-count"
import { ColumnSwatch } from "@/components/column/column-swatch"
import { ROUTES } from "@/lib/routes"

interface IProps {
  entry: DigestCard
  /** Off inside a single board, where every row names the same board. */
  showBoard?: boolean
}

export function UpcomingRow({ entry, showBoard = true }: IProps) {
  const { mutate: moveCardToColumn } = useMoveCardToColumn()

  // Null when the board has no done column, and then there is nowhere to send it.
  const target = entry.isDone ? entry.undoneColumnId : entry.doneColumnId
  const tasks = taskProgress(entry.card.body)

  return (
    <Pressable
      onPress={() => router.push(ROUTES.card(entry.card.id))}
      className={cn(
        "flex-row items-center gap-3 rounded-xl border border-border bg-card p-3 active:opacity-70",
        entry.isDone && "opacity-40"
      )}
    >
      <Checkbox
        checked={entry.isDone}
        className={target ? undefined : "border-dashed"}
        onPress={() => {
          if (!target) {
            router.push(ROUTES.boardDoneColumn(entry.boardId))
            return
          }
          moveCardToColumn({ id: entry.card.id, columnId: target })
        }}
      />
      <View className="min-w-0 flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <Text
            numberOfLines={1}
            className={cn(
              "shrink text-subheadline font-sans-medium text-card-foreground",
              entry.isDone && "text-muted-foreground line-through"
            )}
          >
            {entry.card.title || "Untitled card"}
          </Text>
          <PriorityDot value={entry.card.priority} />
        </View>
        <View className="flex-row items-center gap-1.5">
          <ColumnSwatch color={entry.columnColor} />
          <Text
            numberOfLines={1}
            className="shrink text-xs text-muted-foreground"
          >
            {showBoard
              ? `${entry.boardTitle || "Untitled board"} · ${entry.columnTitle}`
              : entry.columnTitle}
          </Text>
        </View>
      </View>
      {tasks.total > 0 && <TaskCount {...tasks} />}
    </Pressable>
  )
}
