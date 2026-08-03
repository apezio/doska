import { taskProgress } from "@doska/markdown"
import { Text, View } from "react-native"
import { DeadlineChip } from "@/components/card/deadline-chip"
import { TaskCount } from "@/components/card/task-count"

interface IProps {
  displayId: string
  body: string
  deadline: string | null
  /** The card sits in the board's done column. */
  done: boolean
}

/** A card's id, task progress and deadline — the same row the web card shows. */
export function CardMeta({ displayId, body, deadline, done }: IProps) {
  const tasks = taskProgress(body)

  if (!displayId && tasks.total === 0 && !deadline) return null

  return (
    <View className="flex-row items-center gap-4">
      {displayId.length > 0 && (
        <Text className="font-mono text-xs text-muted-foreground">
          #{displayId}
        </Text>
      )}
      {tasks.total > 0 && <TaskCount {...tasks} />}
      {deadline !== null && <DeadlineChip value={deadline} done={done} />}
    </View>
  )
}
