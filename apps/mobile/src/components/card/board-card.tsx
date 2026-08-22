import { cardSoleImage } from "@doska/core/card-sole-image"
import type { CardPatch } from "@doska/core/mutations"
import type { Card } from "@doska/core/types"
import { cut, soleImage, useMarkers } from "@doska/markdown"
import { IconButton, Text } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import MoreHorizontal from "lucide-react-native/icons/ellipsis"
import { memo } from "react"
import { Pressable, View } from "react-native"
import { CardAttachmentImage } from "@/components/card/attachments/card-attachment-image"
import { CardAttachments } from "@/components/card/attachments/card-attachments"
import { CardPreview } from "@/components/card/card-preview"
import { ROUTES } from "@/lib/routes"
import { CardMeta } from "./card-meta"

const BOARD_MARKERS = [cut]

interface IProps {
  card: Card
  deckId: string
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
  showBody,
  done,
  onPatch,
}: IProps) {
  const { body: preview, applied } = useMarkers(
    card.body,
    BOARD_MARKERS,
    "card"
  )
  const hasBody = preview.trim().length > 0
  const bodyImage =
    hasBody && !applied.includes(cut.name) ? soleImage(preview) : null
  const sole = cardSoleImage(hasBody, bodyImage, card.attachments ?? [])
  const bleedKey = sole?.source.kind === "attachment" ? sole.source.key : null

  const actions = (
    <IconButton
      icon={MoreHorizontal}
      label={`${card.title || "Untitled card"} actions`}
      variant="plain"
      size={18}
      onPress={() => router.push(ROUTES.cardActions(card.id))}
    />
  )

  if (bleedKey)
    return (
      <Pressable
        onPress={() => router.push(ROUTES.card(card.id))}
        className="overflow-hidden rounded-xl border border-card-ring bg-card active:opacity-70"
      >
        {!!card.title && (
          <View className="flex-row items-start gap-2 px-3 py-2">
            <Text className="flex-1 text-base font-sans-semibold leading-snug text-card-foreground">
              {card.title}
            </Text>
            {actions}
          </View>
        )}
        <CardAttachmentImage
          cardId={card.id}
          attachmentKey={bleedKey}
          alt={sole?.alt ?? ""}
          bleed
        />
        {card.title ? null : (
          <View className="absolute right-1 top-1 rounded-md bg-card/70">
            {actions}
          </View>
        )}
      </Pressable>
    )

  return (
    <Pressable
      onPress={() => router.push(ROUTES.card(card.id))}
      className="gap-2 overflow-hidden rounded-xl border border-card-ring bg-card py-2 active:opacity-70"
    >
      <View className="flex-row items-start gap-2 px-3">
        <Text className="flex-1 text-lg font-sans-semibold text-card-foreground">
          {card.title || "Untitled card"}
        </Text>
        {actions}
      </View>

      <View className="border-t border-muted px-3 pt-2">
        <CardMeta
          cardId={card.id}
          body={card.body}
          deadline={card.deadline}
          priority={card.priority}
          done={done}
        />
      </View>

      <CardAttachments cardId={card.id} isReadonly className="px-3" />

      {showBody && (
        <CardPreview card={card} deckId={deckId} onPatch={onPatch} />
      )}
    </Pressable>
  )
})
