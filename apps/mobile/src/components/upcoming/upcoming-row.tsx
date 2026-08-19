import { useMoveCardToColumn } from "@doska/core/mutations"
import type { DigestCard } from "@doska/core/operations"
import { taskProgress } from "@doska/markdown"
import { Checkbox, PriorityDot, Text } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import { Pressable, View } from "react-native"
import { TaskCount } from "@/components/card/task-count"
import { ROUTES } from "@/lib/routes"

interface IProps {
  entry: DigestCard
}

export function UpcomingRow({ entry }: IProps) {
  const { mutate: moveCardToColumn } = useMoveCardToColumn()

  // Null when the board has no done column, and then there is nowhere to send it.
  const target = entry.isDone ? entry.undoneColumnId : entry.doneColumnId
  const tasks = taskProgress(entry.card.body)

  return (
    <Pressable
      onPress={() => router.push(ROUTES.card(entry.card.id))}
      className={
        entry.isDone
          ? "flex-row items-center gap-3 rounded-xl border border-border bg-card p-3 opacity-40 active:opacity-70"
          : "flex-row items-center gap-3 rounded-xl border border-border bg-card p-3 active:opacity-70"
      }
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
            className={
              entry.isDone
                ? "shrink text-[15px] font-sans-medium text-muted-foreground line-through"
                : "shrink text-[15px] font-sans-medium text-card-foreground"
            }
          >
            {entry.card.title || "Untitled card"}
          </Text>
          <PriorityDot value={entry.card.priority} />
        </View>
        <Text numberOfLines={1} className="text-xs text-muted-foreground">
          {entry.boardTitle || "Untitled board"} · {entry.columnTitle}
        </Text>
      </View>
      {tasks.total > 0 && <TaskCount {...tasks} />}
    </Pressable>
  )
}
