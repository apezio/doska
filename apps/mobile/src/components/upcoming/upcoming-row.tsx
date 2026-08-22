import {
  useMoveCardToColumn,
  useSaveCard,
  type CardPatch,
} from "@doska/core/mutations"
import type { DigestCard } from "@doska/core/operations"
import { Checkbox, cn, Text } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import { useCallback } from "react"
import { View } from "react-native"
import { BoardCard } from "@/components/card/board-card"
import { ColumnSwatch } from "@/components/column/column-swatch"
import { ROUTES } from "@/lib/routes"

interface IProps {
  entry: DigestCard
  /** Off inside a single board, where every row names the same board. */
  showBoard?: boolean
}

/** One card in the digest: the board card itself, collapsed, with a tick box on
 * the title row and where it lives on the meta row. */
export function UpcomingRow({ entry, showBoard = true }: IProps) {
  const { mutate: moveCardToColumn } = useMoveCardToColumn()
  const { mutate: saveCard } = useSaveCard()

  const patchCard = useCallback(
    (cardId: string, patch: CardPatch) => saveCard({ id: cardId, patch }),
    [saveCard]
  )

  // Null when the board has no done column, and then there is nowhere to send it.
  const target = entry.isDone ? entry.undoneColumnId : entry.doneColumnId

  return (
    <BoardCard
      card={entry.card}
      deckId={entry.boardId}
      showBody={false}
      done={entry.isDone}
      imageCard={false}
      onPatch={patchCard}
      className={cn(entry.isDone && "opacity-40")}
      lead={
        <View className="pt-[6px]">
          <Checkbox
            checked={entry.isDone}
            className={target ? undefined : "border-dashed"}
            onPress={() => {
              if (!target) {
                router.push(ROUTES.boardDoneColumn(entry.boardId))
                return
              }
              moveCardToColumn({ id: entry.card.id, columnId: target })
            }}
          />
        </View>
      }
      metaLead={
        <View className="min-w-0 shrink flex-row items-center gap-1.5">
          <ColumnSwatch color={entry.column.color} neutral />
          <Text
            numberOfLines={1}
            className="shrink text-xs text-muted-foreground"
          >
            {showBoard
              ? `${entry.boardTitle || "Untitled board"} · ${entry.columnTitle}`
              : entry.columnTitle}
          </Text>
        </View>
      }
    />
  )
}
