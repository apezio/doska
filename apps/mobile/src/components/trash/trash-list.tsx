import { useRestore } from "@doska/core/mutations"
import type { TrashEntry } from "@doska/core/operations"
import { Text } from "@doska/ui-kit-mobile"
import { FlatList, RefreshControl } from "react-native"
import { TrashRow } from "@/components/trash/trash-row"
import { useSyncRefresh } from "@/lib/use-sync-refresh"

interface IProps {
  entries: TrashEntry[]
  boardIds: string[]
}

export function TrashList({ entries, boardIds }: IProps) {
  const { mutate: restore, variables, isPending } = useRestore()
  const restoringId = isPending ? (variables?.id ?? null) : null
  const { refreshing, onRefresh } = useSyncRefresh(boardIds)

  return (
    <FlatList
      data={entries}
      keyExtractor={(entry) => `${entry.kind}/${entry.id}`}
      contentContainerClassName="gap-2 p-3"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListHeaderComponent={
        <Text className="pb-1 text-footnote text-muted-foreground">
          Items here are permanently deleted after 14 days.
        </Text>
      }
      renderItem={({ item }) => (
        <TrashRow
          entry={item}
          isRestoring={restoringId === item.id}
          onRestore={() => restore({ kind: item.kind, id: item.id })}
        />
      )}
    />
  )
}
