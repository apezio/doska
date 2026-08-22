import { taskProgress, type TaskProgress } from "@doska/markdown"
import { PriorityChip } from "@doska/ui-kit-mobile"
import type { ReactNode } from "react"
import { router } from "expo-router"
import { Pressable, View } from "react-native"
import { DeadlineChip } from "@/components/card/deadline-chip"
import { TaskCount } from "@/components/card/task-count"
import { ROUTES } from "@/lib/routes"

interface IProps {
  cardId: string
  body: string
  deadline: string | null
  priority: string
  /** The card sits in the board's done column. */
  done: boolean
  /** Already-counted progress, for a caller that needed the count itself. */
  tasks?: TaskProgress
  /** Opens the row, for the card's column or board. */
  lead?: ReactNode
}

/** A card's task progress, deadline and priority. An unset deadline or priority
 * shows nothing — it is set from the card's actions sheet. */
export function CardMeta({
  cardId,
  body,
  deadline,
  priority,
  done,
  tasks,
  lead,
}: IProps) {
  const { done: doneTasks, total } = tasks ?? taskProgress(body)
  if (!lead && total === 0 && !deadline && !priority) return null

  return (
    <View className="flex-row items-center gap-4 py-2">
      {lead}
      {total > 0 && <TaskCount done={doneTasks} total={total} />}
      {/* Nested in the board card's Pressable, which it shadows: the chip is
          the deadline control on the card as well as in its sheet. */}
      {!!deadline && (
        <Pressable
          onPress={() => router.push(ROUTES.cardDeadline(cardId))}
          accessibilityRole="button"
          accessibilityLabel="Due date"
          hitSlop={6}
        >
          <DeadlineChip value={deadline} done={done} />
        </Pressable>
      )}
      {!!priority && (
        <Pressable
          onPress={() => router.push(ROUTES.cardPriority(cardId))}
          accessibilityRole="button"
          accessibilityLabel="Priority"
          hitSlop={6}
        >
          <PriorityChip value={priority} />
        </Pressable>
      )}
    </View>
  )
}
