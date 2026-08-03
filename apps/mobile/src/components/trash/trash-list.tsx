import { useRestore } from "@doska/core/mutations"
import type { TrashEntry } from "@doska/core/operations"
import { FlatList, Text } from "react-native"
import { TrashRow } from "@/components/trash/trash-row"

interface IProps {
  entries: TrashEntry[]
}

export function TrashList({ entries }: IProps) {
  const { mutate: restore, variables, isPending } = useRestore()
  const restoringId = isPending ? (variables?.id ?? null) : null

  return (
    <FlatList
      data={entries}
      keyExtractor={(entry) => `${entry.kind}/${entry.id}`}
      contentContainerClassName="gap-2 p-3"
      ListHeaderComponent={
        <Text className="pb-1 text-[13px] text-muted-foreground">
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
