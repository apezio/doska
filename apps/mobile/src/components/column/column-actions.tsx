import { useSetColumnDone } from "@doska/core/mutations"
import { useBoard } from "@doska/core/queries"
import { COLUMN_COLORS } from "@doska/tokens/columns"
import { Separator, SheetItem } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import CircleCheck from "lucide-react-native/icons/circle-check"
import Palette from "lucide-react-native/icons/palette"
import Trash2 from "lucide-react-native/icons/trash-2"
import { View } from "react-native"
import { ROUTES } from "@/lib/routes"

interface IProps {
  deckId: string
  columnId: string
}

export function ColumnActions({ deckId, columnId }: IProps) {
  const { data: board } = useBoard(deckId)
  const { mutate: setDone } = useSetColumnDone(deckId)

  const column = board?.columns.find((one) => one.id === columnId)
  if (!column) return null

  return (
    <View className="gap-1">
      <SheetItem
        icon={Palette}
        label="Color"
        trailing={
          COLUMN_COLORS.find((one) => one.id === column.color)?.label ?? "None"
        }
        onPress={() => router.push(ROUTES.columnColor(column.id))}
      />
      <SheetItem
        icon={CircleCheck}
        label={column.done ? "Unmark cards as done" : "Mark cards as done"}
        onPress={() => {
          setDone({ id: column.id, done: !column.done })
          router.back()
        }}
      />
      <Separator className="my-1" />
      <SheetItem
        icon={Trash2}
        label="Delete column"
        destructive
        onPress={() => router.push(ROUTES.columnDelete(column.id))}
      />
    </View>
  )
}
