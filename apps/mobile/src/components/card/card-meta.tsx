import { taskProgress } from "@doska/markdown"
import { router } from "expo-router"
import { Pressable, Text, View } from "react-native"
import { DeadlineChip } from "@/components/card/deadline-chip"
import { TaskCount } from "@/components/card/task-count"
import { ROUTES } from "@/lib/routes"

interface IProps {
  cardId: string
  displayId?: string
  body: string
  deadline: string | null
  /** The card sits in the board's done column. */
  done: boolean
}

export function CardMeta({ cardId, displayId, body, deadline, done }: IProps) {
  const tasks = taskProgress(body)

  return (
    <View className="flex-row items-center gap-4">
      {!!displayId && (
        <Text className="font-mono text-xs text-muted-foreground">
          #{displayId}
        </Text>
      )}
      {tasks.total > 0 && <TaskCount {...tasks} />}
      {/* Nested in the board card's Pressable, which it shadows: the chip is
          the deadline control on the card as well as in its sheet. */}
      <Pressable
        onPress={() => router.push(ROUTES.cardDeadline(cardId))}
        accessibilityRole="button"
        accessibilityLabel="Due date"
        hitSlop={6}
      >
        <DeadlineChip value={deadline} done={done} />
      </Pressable>
    </View>
  )
}
