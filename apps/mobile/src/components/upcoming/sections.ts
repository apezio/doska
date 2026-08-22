import type { DigestGroup } from "@doska/core/operations"
import { deadlineLabel, longDate, weekday } from "@doska/core/utils"

export interface GroupSection {
  title: string
  /** The weekday and the countdown, empty for the dateless piles. */
  aside: string
  kind: DigestGroup["kind"]
}

/** A group's `SectionList` section — its heading, and the entries as `data`. */
export function toSection(group: DigestGroup): GroupSection & {
  data: DigestGroup["entries"]
} {
  return {
    title:
      group.kind === "overdue"
        ? "Overdue"
        : group.kind === "undated"
          ? "No deadline"
          : longDate(group.date),
    aside:
      group.kind === "date"
        ? `${weekday(group.date)} · ${deadlineLabel(group.date)}`
        : "",
    kind: group.kind,
    data: group.entries,
  }
}
