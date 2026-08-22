import { useCardRef } from "@doska/core/card-refs"
import { columnSwatch } from "@doska/tokens/columns"
import { cn, Text } from "@doska/ui-kit-mobile"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import { router } from "expo-router"
import { ROUTES } from "@/lib/routes"

interface IProps {
  deckId: string
  displayId: string
  /** The label as in `[[12|Fix the sync bug]]`. */
  alias?: string
}

/**
 * A `[[12]]` reference inside a card body: the card's title, led by a dot
 * in its column's color.
 */
export function CardRefLink({ deckId, displayId, alias }: IProps) {
  const tokens = useTokens()
  const ref = useCardRef(deckId, displayId)

  if (!ref)
    return (
      <Text className="text-base text-muted-foreground underline">
        {alias ? `${displayId} — ${alias}` : displayId}
      </Text>
    )

  const { card, columnTitle, columnColor, columnDone } = ref
  const swatch = columnSwatch(columnColor, tokens.dark ? "dark" : "light")

  return (
    <Text
      onPress={() => router.push(ROUTES.card(card.id))}
      accessibilityRole="link"
    >
      {!!columnTitle && (
        <Text
          className="text-[18px]"
          style={{ color: swatch ? swatch.dot : `${tokens.mutedForeground}66` }}
        >
          {"● "}
        </Text>
      )}
      <Text
        className={cn(
          "font-sans-semibold text-base",
          columnDone && "line-through text-muted-foreground"
        )}
      >
        {alias || card.title || "Untitled card"}
      </Text>
    </Text>
  )
}
