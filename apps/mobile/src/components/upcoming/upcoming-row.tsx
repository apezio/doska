import type { DigestCard } from "@doska/core/operations"
import { Text, View } from "react-native"

interface IProps {
  entry: DigestCard
}

export function UpcomingRow({ entry }: IProps) {
  return (
    <View className="gap-1 rounded-xl border border-border bg-card p-3">
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
  )
}
