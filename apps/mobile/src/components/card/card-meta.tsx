import { taskProgress } from "@doska/markdown"
import { PriorityChip, Text } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import { Pressable, View } from "react-native"
import { DeadlineChip } from "@/components/card/deadline-chip"
import { TaskCount } from "@/components/card/task-count"
import { ROUTES } from "@/lib/routes"

interface IProps {
  cardId: string
  displayId: string
  body: string
  deadline: string | null
  priority: string
  /** The card sits in the board's done column. */
  done: boolean
}

/** A card's id, task progress, deadline and priority — the same row the web
 * card shows. */
export function CardMeta({
  cardId,
  displayId,
  body,
  deadline,
  priority,
  done,
}: IProps) {
  const tasks = taskProgress(body)

  return (
    <View className="flex-row items-center gap-4 py-2">
      {displayId.length > 0 && (
        <Text className="font-mono text-xs text-muted-foreground">
          #{displayId}
        </Text>
      )}
      {tasks.total > 0 && <TaskCount {...tasks} />}
      <Pressable
        onPress={() => router.push(ROUTES.cardDeadline(cardId))}
        accessibilityRole="button"
        accessibilityLabel="Due date"
        hitSlop={6}
      >
        <DeadlineChip value={deadline} done={done} />
      </Pressable>
      <Pressable
        onPress={() => router.push(ROUTES.cardPriority(cardId))}
        accessibilityRole="button"
        accessibilityLabel="Priority"
        hitSlop={6}
      >
        <PriorityChip value={priority} />
      </Pressable>
    </View>
  )
}
