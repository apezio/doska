import type { DigestCard } from "@doska/core/operations"
import { todayIso } from "@doska/core/utils"
import { EmptyState } from "@doska/ui-kit-mobile"
import { SectionList, Text } from "react-native"
import { UpcomingRow } from "@/components/upcoming/upcoming-row"

/** The same three buckets the web digest shows, and the shape a deadline
 * notification will want in DSK-78. */
function sections(cards: DigestCard[]) {
  const today = todayIso()
  const overdue: DigestCard[] = []
  const due: DigestCard[] = []
  const later: DigestCard[] = []

  for (const entry of cards) {
    const deadline = entry.card.deadline
    if (deadline === null) continue
    if (deadline < today) overdue.push(entry)
    else if (deadline === today) due.push(entry)
    else later.push(entry)
  }

  return [
    { title: "Overdue", data: overdue },
    { title: "Today", data: due },
    { title: "Next 60 days", data: later },
  ].filter((section) => section.data.length > 0)
}

interface IProps {
  cards: DigestCard[]
}

export function UpcomingList({ cards }: IProps) {
  const grouped = sections(cards)

  if (grouped.length === 0) return <EmptyState message="Nothing due." />

  return (
    <SectionList
      sections={grouped}
      keyExtractor={(entry) => entry.card.id}
      contentContainerClassName="gap-2 p-3"
      renderSectionHeader={({ section }) => (
        <Text className="pt-3 text-xs font-sans-semibold uppercase text-muted-foreground">
          {section.title}
        </Text>
      )}
      renderItem={({ item }) => <UpcomingRow entry={item} />}
    />
  )
}
