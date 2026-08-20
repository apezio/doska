import { MenuItem, MenuSeparator } from "@doska/ui-kit"
import { Hash } from "lucide-react"
import { useCard } from "@doska/core/queries"
import { cardDisplayId } from "@doska/contract/prefix"
import { useDeckPrefix } from "@/providers/deck/deck-context"

/** Copies the card's display id (`ROAD-12`). Nothing to copy on a board with
 *  no prefix, or a card that has never synced. */
export function CopyIdItem({ cardId }: { cardId: string }) {
  const { data: card } = useCard(cardId)
  const prefix = useDeckPrefix()

  const displayId = cardDisplayId(prefix, card?.number)
  if (!displayId) return null

  return (
    <>
      <MenuSeparator />
      <MenuItem onClick={() => void navigator.clipboard?.writeText(displayId)}>
        <Hash />
        Copy id
      </MenuItem>
    </>
  )
}
