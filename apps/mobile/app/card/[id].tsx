import { useCardSave } from "@doska/core/mutations"
import { useCard } from "@doska/core/queries"
import { Spinner } from "@doska/ui-kit-mobile"
import { router, useLocalSearchParams } from "expo-router"
import { useEffect } from "react"
import { View } from "react-native"
import { CardPane } from "@/components/card-sheet/card-pane"

export default function CardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: card } = useCard(id ?? null)
  // Flushes its queued write on unmount, which covers every way this sheet
  // closes — including the swipe down, which is now the only way out.
  const { queue } = useCardSave()

  const deleted = Boolean(card?.deletedAt)
  useEffect(() => {
    if (deleted && router.canGoBack()) router.back()
  }, [deleted])

  if (!id || !card) {
    return (
      <View className="flex-1 bg-card">
        <Spinner />
      </View>
    )
  }

  return <CardPane key={id} cardId={id} content={card} onQueue={queue} />
}
