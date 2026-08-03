import type { DigestCard } from "@doska/core/operations"
import { router } from "expo-router"
import { Pressable, Text } from "react-native"
import { ROUTES } from "@/lib/routes"

interface IProps {
  entry: DigestCard
}

export function UpcomingRow({ entry }: IProps) {
  return (
    <Pressable
      onPress={() => router.push(ROUTES.card(entry.card.id))}
      className="gap-1 rounded-xl border border-border bg-card p-3 active:opacity-70"
    >
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
    </Pressable>
  )
}
