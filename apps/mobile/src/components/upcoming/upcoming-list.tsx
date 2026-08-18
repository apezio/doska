import { groupByDeadline, type DigestCard } from "@doska/core/operations"
import { deadlineLabel, longDate, weekday } from "@doska/core/utils"
import { EmptyState } from "@doska/ui-kit-mobile"
import { RefreshControl, SectionList, Text, View } from "react-native"
import { UpcomingRow } from "@/components/upcoming/upcoming-row"
import { useSyncRefresh } from "@/lib/use-sync-refresh"

interface IProps {
  cards: DigestCard[]
  hideDone: boolean
  boardIds: string[]
}

export function UpcomingList({ cards, hideDone, boardIds }: IProps) {
  const { refreshing, onRefresh } = useSyncRefresh(boardIds)
  const visible = hideDone ? cards.filter((one) => !one.isDone) : cards
  const sections = groupByDeadline(visible).map((group) => ({
    title: group.date ? longDate(group.date) : "Overdue",
    // Empty for the overdue group, which spans every date before today.
    aside: group.date
      ? `${weekday(group.date)} · ${deadlineLabel(group.date)}`
      : "",
    overdue: group.date === "",
    data: group.entries,
  }))

  if (sections.length === 0) return <EmptyState message="Nothing due." />

  return (
    <SectionList
      sections={sections}
      keyExtractor={(entry) => entry.card.id}
      contentContainerClassName="gap-2 p-3"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      renderSectionHeader={({ section }) => (
        <View className="flex-row items-baseline gap-2 pt-3">
          <Text
            className={
              section.overdue
                ? "text-xs font-sans-semibold uppercase text-destructive"
                : "text-xs font-sans-semibold uppercase text-muted-foreground"
            }
          >
            {section.title}
          </Text>
          {section.aside.length > 0 && (
            <Text className="text-xs text-muted-foreground/70">
              {section.aside}
            </Text>
          )}
        </View>
      )}
      renderItem={({ item }) => <UpcomingRow entry={item} />}
    />
  )
}
