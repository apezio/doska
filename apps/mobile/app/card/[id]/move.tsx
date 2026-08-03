import { SheetScreen } from "@doska/ui-kit-mobile"
import { router, useLocalSearchParams } from "expo-router"
import { CardMove } from "@/components/card/sheet/card-move"

export default function CardMoveSheet() {
  const { id } = useLocalSearchParams<{ id: string }>()
  if (!id) return null

  return (
    <SheetScreen>
      <CardMove cardId={id} onDone={() => router.back()} />
    </SheetScreen>
  )
}
