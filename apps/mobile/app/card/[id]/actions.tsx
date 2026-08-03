import { SheetScreen } from "@doska/ui-kit-mobile"
import { useLocalSearchParams } from "expo-router"
import { CardActions } from "@/components/card/sheet/card-actions"

export default function CardActionsSheet() {
  const { id } = useLocalSearchParams<{ id: string }>()
  if (!id) return null

  return (
    <SheetScreen>
      <CardActions cardId={id} />
    </SheetScreen>
  )
}
