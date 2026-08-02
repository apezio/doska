import type { DigestCard } from "@doska/core/operations"
import { useDashboards, useDigest } from "@doska/core/queries"
import { sync } from "@doska/core/sync"
import { todayIso } from "@doska/core/utils"
import { EmptyState, Spinner } from "@doska/ui-kit-mobile"
import { useFocusEffect } from "expo-router"
import { useCallback } from "react"
import { SectionList, Text, View } from "react-native"
import { ScreenHeader, ScreenTitle } from "@/components/screen-header"

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
  // Scoped to focus, not to mount: the drawer leaves this screen mounted, and
  // watching every board is not what the board screen wants behind it.
  const boardIds = dashboards.map((dashboard) => dashboard.id).join(",")
  useFocusEffect(
    useCallback(() => {
      if (!boardIds) return
      void sync.watchBoards(boardIds.split(","))
      return () => void sync.watchBoards([])
    }, [boardIds])
  )

  const grouped = data ? sections(data) : []

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader>
        <ScreenTitle>Upcoming</ScreenTitle>
      </ScreenHeader>

      {!data ? (
        <Spinner />
      ) : grouped.length === 0 ? (
        <EmptyState message="Nothing due." />
      ) : (
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
      )}
    </View>
  )
}
