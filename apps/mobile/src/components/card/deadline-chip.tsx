import { Chip } from "@doska/ui-kit-mobile"
import {
  deadlineRelative,
  deadlineStatus,
  formatDeadline,
} from "@doska/ui-kit/deadline"
import { Text } from "react-native"

/** Matches the web's `CHIP_BY_STATUS`, minus the hover state. */
const CHIP = {
  overdue: { box: "bg-deadline-overdue", text: "text-destructive" },
  soon: { box: "bg-deadline-soon", text: "text-deadline-soon-foreground" },
  upcoming: { box: "", text: "text-muted-foreground" },
}

interface IProps {
  value: string
  /** The card sits in the board's done column. */
  done: boolean
}

export function DeadlineChip({ value, done }: IProps) {
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
