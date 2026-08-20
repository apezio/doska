import { useUpdateCard } from "@doska/core/mutations"
import type { Card } from "@doska/core/types"
import { cut, toggleTaskByIndex } from "@doska/markdown"
import { Text, View } from "react-native"
import { MarkdownView } from "@/components/markdown/markdown-view"
import { CardMarkdown } from "./card-markdown"

interface IProps {
  card: Card
  deckId: string
}

/** The card's body down to the cut marker, or nothing if it has no body. */
export function CardPreview({ card, deckId }: IProps) {
  const { mutate: updateCard } = useUpdateCard(card.id)
  // `hasMore` is the cut marker having fired: the rest opens in the card view.
  const { body: preview, applied: hasMore } = cut.cardRender(card.body)

  if (!preview.trim()) return null

  return (
    <View className="gap-1 border-t border-muted px-3 pt-2">
      <CardMarkdown deckId={deckId}>
        <MarkdownView
          onToggleTask={(index) =>
            updateCard({ body: toggleTaskByIndex(card.body, index) })
          }
        >
          {preview}
        </MarkdownView>
      </CardMarkdown>
      {hasMore && (
        <Text className="text-[13px] text-muted-foreground">
          Open to see more
        </Text>
      )}
    </View>
  )
}
