import { groupByDeadline, type DigestCard } from "@doska/core/operations"
import { longDate } from "@doska/core/utils"
import { EmptyState } from "@doska/ui-kit-mobile"
import { SectionList, Text } from "react-native"
import { UpcomingRow } from "@/components/upcoming/upcoming-row"

interface IProps {
  cards: DigestCard[]
  hideDone: boolean
}

export function UpcomingList({ cards, hideDone }: IProps) {
  const visible = hideDone ? cards.filter((one) => !one.isDone) : cards
  const sections = groupByDeadline(visible).map((group) => ({
    title: group.date ? longDate(group.date) : "Overdue",
    overdue: group.date === "",
    data: group.entries,
  }))

  if (sections.length === 0) return <EmptyState message="Nothing due." />

  return (
    <SectionList
      sections={sections}
      keyExtractor={(entry) => entry.card.id}
      contentContainerClassName="gap-2 p-3"
      renderSectionHeader={({ section }) => (
        <Text
          className={
            section.overdue
              ? "pt-3 text-xs font-sans-semibold uppercase text-destructive"
              : "pt-3 text-xs font-sans-semibold uppercase text-muted-foreground"
          }
        >
          {section.title}
        </Text>
      )}
      renderItem={({ item }) => <UpcomingRow entry={item} />}
    />
  )
}
