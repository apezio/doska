import { taskProgress } from "@doska/markdown"
import { Chip } from "@doska/ui-kit-mobile"
import {
  deadlineRelative,
  deadlineStatus,
  formatDeadline,
} from "@doska/ui-kit/deadline"
import { Text, View } from "react-native"

/** Matches the web's `CHIP_BY_STATUS`, minus the hover state. */
const CHIP = {
  overdue: { box: "bg-deadline-overdue", text: "text-destructive" },
  soon: { box: "bg-deadline-soon", text: "text-deadline-soon-foreground" },
  upcoming: { box: "", text: "text-muted-foreground" },
}

function Deadline({ value, done }: { value: string; done: boolean }) {
  // A done card is neutral whatever its deadline: no red, plain date.
  const status = done ? "upcoming" : deadlineStatus(value)
  const label =
    status === "upcoming" ? formatDeadline(value) : deadlineRelative(value)
  const chip = CHIP[status]

  return (
    <Chip className={chip.box}>
      <Text className={`text-xs font-sans-semibold ${chip.text}`}>{label}</Text>
    </Chip>
  )
}

function Tasks({ done, total }: { done: number; total: number }) {
  return (
    <View className="flex-row items-center gap-1">
      <View
        className={
          done === total
            ? "size-3.5 rounded-full border-[3px] border-muted-foreground"
            : "size-3.5 rounded-full border border-muted-foreground"
        }
      />
      <Text className="font-mono text-xs text-muted-foreground">
        {done}/{total}
      </Text>
    </View>
  )
}

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
      {displayId ? (
        <Text className="font-mono text-xs text-muted-foreground">
          #{displayId}
        </Text>
      ) : null}
      {tasks.total > 0 ? <Tasks {...tasks} /> : null}
      {deadline ? <Deadline value={deadline} done={done} /> : null}
    </View>
  )
}
