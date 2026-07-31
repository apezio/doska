import type { DigestCard } from "@doska/core/operations"
import { useDashboards, useDigest } from "@doska/core/queries"
import { sync } from "@doska/core/sync"
import { todayIso } from "@doska/core/utils"
import { useEffect } from "react"
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
  const { data: dashboards = [] } = useDashboards()

  // This view spans every board, so it has to pull every board — otherwise it
  // reads a partial picture. Waits on the list, which is what defines "every".
  const boardIds = dashboards.map((dashboard) => dashboard.id).join(",")
  useEffect(() => {
    if (!boardIds) return
    void sync.watchBoards(boardIds.split(","))
    return () => void sync.watchBoards([])
  }, [boardIds])

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    )
  }

  const grouped = sections(data)
  if (grouped.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Nothing due.</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-background">
      <SectionList
        sections={grouped}
        keyExtractor={(entry) => entry.card.id}
        contentContainerClassName="gap-2 p-3"
        renderSectionHeader={({ section }) => (
          <Text className="pt-3 text-xs font-sans-semibold uppercase text-muted-foreground">
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <View className="gap-1 rounded-xl border border-border bg-card p-3">
            <Text
              className={
                item.isDone
                  ? "text-[15px] font-sans-medium text-muted-foreground line-through"
                  : "text-[15px] font-sans-medium text-card-foreground"
              }
            >
              {item.card.title}
            </Text>
            <Text className="text-xs text-muted-foreground">
              {item.card.deadline} · {item.boardTitle} · {item.columnTitle}
            </Text>
          </View>
        )}
      />
    </View>
  )
}
