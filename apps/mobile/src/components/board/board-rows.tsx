import { boardDigest, groupBoardCards } from "@doska/core/operations"
import { useBoard } from "@doska/core/queries"
import type { Dashboard } from "@doska/core/types"
import { EmptyState, Spinner } from "@doska/ui-kit-mobile"
import { useMemo } from "react"
import { RefreshControl, SectionList } from "react-native"
import { GroupHeading } from "@/components/upcoming/group-heading"
import { toSection } from "@/components/upcoming/sections"
import { UpcomingRow } from "@/components/upcoming/upcoming-row"
import { useSyncRefresh } from "@/lib/use-sync-refresh"

/** The open board as one date-grouped list rather than its columns — the web's
 * row view. Every row names the same board, so only the column is shown. */
export function BoardRows({ board }: { board: Dashboard }) {
  const { data, isPending } = useBoard(board.id)
  const { refreshing, onRefresh } = useSyncRefresh([board.id])

  const sections = useMemo(
    () =>
      data
        ? groupBoardCards(boardDigest(data, board.title)).map(toSection)
        : [],
    [data, board.title]
  )

  if (isPending) return <Spinner />
  if (sections.length === 0)
    return <EmptyState message="This board has no cards yet." />

  return (
    <SectionList
      sections={sections}
      keyExtractor={(entry) => entry.card.id}
      contentContainerClassName="gap-2 p-3"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      renderSectionHeader={({ section }) => <GroupHeading section={section} />}
      renderItem={({ item }) => <UpcomingRow entry={item} showBoard={false} />}
    />
  )
}
