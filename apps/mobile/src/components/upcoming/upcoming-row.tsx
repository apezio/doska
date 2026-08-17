import { useMoveCardToColumn } from "@doska/core/mutations"
import type { DigestCard } from "@doska/core/operations"
import { Checkbox } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import { Pressable, Text, View } from "react-native"
import { ROUTES } from "@/lib/routes"

interface IProps {
  entry: DigestCard
}

export function UpcomingRow({ entry }: IProps) {
  const { mutate: moveCardToColumn } = useMoveCardToColumn()

  // Null when the board has no done column, and then there is nowhere to send it.
  const target = entry.isDone ? entry.undoneColumnId : entry.doneColumnId

  return (
    <Pressable
      onPress={() => router.push(ROUTES.card(entry.card.id))}
      className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3 active:opacity-70"
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
      <View className="flex-1 gap-1">
        <Text
          className={
            entry.isDone
              ? "text-[15px] font-sans-medium text-muted-foreground line-through"
              : "text-[15px] font-sans-medium text-card-foreground"
          }
        >
          {entry.card.title}
        </Text>
        <Text className="text-xs text-muted-foreground">
          {entry.card.deadline} · {entry.boardTitle} · {entry.columnTitle}
        </Text>
      </View>
    </Pressable>
  )
}
