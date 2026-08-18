import { cardDisplayId } from "@doska/contract/prefix"
import type { CardPatch } from "@doska/core/mutations"
import type { Card } from "@doska/core/types"
import { IconButton } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import MoreHorizontal from "lucide-react-native/icons/ellipsis"
import { memo } from "react"
import { Pressable, Text, View } from "react-native"
import { CardPreview } from "@/components/card/card-preview"
import { ROUTES } from "@/lib/routes"
import { CardMeta } from "./card-meta"

interface IProps {
  card: Card
  deckId: string
  prefix: string
  /** The card's column is collapsed, so only the title and meta show. */
  showBody: boolean
  /** The card sits in the board's done column. */
  done: boolean
  onPatch: (id: string, patch: CardPatch) => void
}

/** A board card: title, meta row, then the cut-truncated body preview. */
export const BoardCard = memo(function BoardCard({
  card,
  deckId,
  prefix,
  showBody,
  done,
  onPatch,
}: IProps) {
  return (
    <Pressable
      onPress={() => router.push(ROUTES.card(card.id))}
      className="gap-2 overflow-hidden rounded-xl border border-card-ring bg-card py-2 active:opacity-70"
    >
      <View className="flex-row items-start gap-2 px-3">
        <Text className="flex-1 text-base font-sans-semibold leading-snug text-card-foreground">
          {card.title || "Untitled card"}
        </Text>
        {/* Nested in the card's own Pressable, which it shadows: a tap here
            opens the actions rather than the card. */}
        <IconButton
          icon={MoreHorizontal}
          label={`${card.title || "Untitled card"} actions`}
          variant="plain"
          size={18}
          onPress={() => router.push(ROUTES.cardActions(card.id))}
        />
      </View>

      <View className="border-t border-muted px-3 pt-2">
        <CardMeta
          cardId={card.id}
          displayId={cardDisplayId(prefix, card.number) ?? ""}
          body={card.body}
          deadline={card.deadline}
          priority={card.priority}
          done={done}
        />
      </View>

      {showBody && (
        <CardPreview
          card={card}
          deckId={deckId}
          prefix={prefix}
          onPatch={onPatch}
        />
      )}
    </Pressable>
  )
})
