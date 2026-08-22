import type { CardPatch } from "@doska/core/mutations"
import type { Card } from "@doska/core/types"
import { cut, toggleTaskByIndex, useMarkers } from "@doska/markdown"
import { Text } from "@doska/ui-kit-mobile"
import { useCallback } from "react"
import { View } from "react-native"
import { MarkdownView } from "@/components/markdown/markdown-view"
import { CardMarkdown } from "./card-markdown"

const BOARD_MARKERS = [cut]

interface IProps {
  card: Card
  deckId: string
  onPatch: (id: string, patch: CardPatch) => void
}

/** The card's body down to the cut marker, or nothing if it has no body. */
export function CardPreview({ card, deckId, onPatch }: IProps) {
  const { body: preview, applied } = useMarkers(
    card.body,
    BOARD_MARKERS,
    "card"
  )
  // The cut marker having fired: the rest opens in the card view.
  const hasMore = applied.includes(cut.name)

  const toggleTask = useCallback(
    (index: number) =>
      onPatch(card.id, { body: toggleTaskByIndex(card.body, index) }),
    [card.id, card.body, onPatch]
  )

  if (!preview.trim()) return null

  return (
    <View className="gap-1 border-t border-border px-3 pt-2">
      <CardMarkdown cardId={card.id} deckId={deckId}>
        <MarkdownView onToggleTask={toggleTask}>{preview}</MarkdownView>
      </CardMarkdown>
      {hasMore && (
        <Text className="text-sm text-muted-foreground mt-2">
          Open to see more
        </Text>
      )}
    </View>
  )
}
