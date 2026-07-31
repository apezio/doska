import type { DigestCard } from "@doska/core/operations"
import { useDigest } from "@doska/core/queries"
import { todayIso } from "@doska/core/utils"
import { ActivityIndicator, SectionList, Text, View } from "react-native"

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

export default function UpcomingScreen() {
  const { data } = useDigest("week")

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-950">
        <ActivityIndicator />
      </View>
    )
  }

  const grouped = sections(data)
  if (grouped.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-950">
        <Text className="text-neutral-500">Nothing due.</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <SectionList
        sections={grouped}
        keyExtractor={(entry) => entry.card.id}
        contentContainerClassName="gap-2 p-3"
        renderSectionHeader={({ section }) => (
          <Text className="pt-3 text-xs font-semibold uppercase text-neutral-400">
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <View className="gap-1 rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
            <Text
              className={
                item.isDone
                  ? "text-[15px] font-medium text-neutral-400 line-through"
                  : "text-[15px] font-medium text-neutral-900 dark:text-neutral-100"
              }
            >
              {item.card.title}
            </Text>
            <Text className="text-xs text-neutral-400">
              {item.card.deadline} · {item.boardTitle} · {item.columnTitle}
            </Text>
          </View>
        )}
      />
    </View>
  )
}
