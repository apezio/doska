import { useBoard } from "@doska/core/queries"
import { searchCards } from "@doska/core/search"
import { EmptyState, Spinner, Text } from "@doska/ui-kit-mobile"
import { useMemo } from "react"
import { FlatList } from "react-native"
import { SearchResultRow } from "@/components/search/search-result-row"

interface IProps {
  deckId: string
  prefix: string
  query: string
  onSelect: (cardId: string) => void
}

export function SearchResults({ deckId, prefix, query, onSelect }: IProps) {
  const { data: board } = useBoard(deckId)
  const trimmed = query.trim()

  const hits = useMemo(
    () =>
      trimmed === "" || !board
        ? []
        : searchCards({
            cards: board.cards,
            columns: board.columns,
            query: trimmed,
          }),
    [board, trimmed]
  )

  if (trimmed === "") {
    return <EmptyState message="Type to search this board." />
  }
  if (!board) return <Spinner />
  if (hits.length === 0) {
    return <EmptyState message={`No cards match “${trimmed}”.`} />
  }

  return (
    <FlatList
      data={hits}
      keyExtractor={(hit) => hit.card.id}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerClassName="gap-2 p-3"
      ListHeaderComponent={
        <Text className="pb-1 text-[13px] text-muted-foreground">
          {hits.length === 1 ? "1 result" : `${hits.length} results`}
        </Text>
      }
      renderItem={({ item }) => (
        <SearchResultRow
          hit={item}
          prefix={prefix}
          onPress={() => onSelect(item.card.id)}
        />
      )}
    />
  )
}
