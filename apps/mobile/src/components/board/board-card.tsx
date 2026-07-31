import { cardDisplayId } from "@doska/contract/prefix"
import { useUpdateCard } from "@doska/core/mutations"
import type { Card } from "@doska/core/types"
import { cut, toggleTaskByIndex } from "@doska/markdown/core"
import { router } from "expo-router"
import { Pressable, Text, View } from "react-native"
import { MarkdownView } from "@/components/markdown/markdown-view"
import { CardMeta } from "./card-meta"

interface IProps {
  card: Card
  prefix: string
  /** The card's column is collapsed, so only the title and meta show. */
  showBody: boolean
  /** The card sits in the board's done column. */
  done: boolean
}

/** A board card: title, meta row, then the cut-truncated body preview. */
export function BoardCard({ card, prefix, showBody, done }: IProps) {
  const { mutate: updateCard } = useUpdateCard(card.id)
  // `hasMore` is the cut marker having fired: the rest opens in the card view.
  const { body: preview, applied: hasMore } = cut.cardRender(card.body)
  const hasBody = preview.trim().length > 0

  return (
    <Pressable
      onPress={() => router.push(`/card/${card.id}`)}
      className="mb-3 gap-2 overflow-hidden rounded-xl border border-card-ring bg-card py-2 active:opacity-70"
    >
      <View className="px-3">
        <Text className="text-base font-sans-semibold leading-snug text-card-foreground">
          {card.title || "Untitled card"}
        </Text>
      </View>

      <View className="border-t border-muted px-3 pt-2">
        <CardMeta
          displayId={cardDisplayId(prefix, card.number) ?? ""}
          body={card.body}
          deadline={card.deadline}
          done={done}
        />
      </View>

      {hasBody && showBody ? (
        <View className="gap-1 border-t border-muted px-3 pt-2">
          <MarkdownView
            onToggleTask={(index) =>
              updateCard({ body: toggleTaskByIndex(card.body, index) })
            }
          >
            {preview}
          </MarkdownView>
          {hasMore ? (
            <Text className="text-[13px] text-muted-foreground">
              Open to see more
            </Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  )
}
