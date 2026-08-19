import { useSetColumnColor } from "@doska/core/mutations"
import { useBoard } from "@doska/core/queries"
import { COLUMN_COLORS } from "@doska/tokens/columns"
import { SheetScreen, Text } from "@doska/ui-kit-mobile"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import { router, useLocalSearchParams } from "expo-router"
import Check from "lucide-react-native/icons/check"
import { Pressable, View } from "react-native"
import { ColumnSwatch } from "@/components/column/column-swatch"
import { useActiveBoard } from "@/lib/use-active-board"

/** No color first, the way the web's column color menu lists it. */
const OPTIONS = [{ id: "", label: "No color" }, ...COLUMN_COLORS]

export default function ColumnColorSheet() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { deckId } = useActiveBoard()
  if (!deckId || !id) return null

  return <Body deckId={deckId} columnId={id} />
}

function Body({ deckId, columnId }: { deckId: string; columnId: string }) {
  const tokens = useTokens()
  const { data: board } = useBoard(deckId)
  const { mutate: setColor } = useSetColumnColor(deckId)

  const column = board?.columns.find((one) => one.id === columnId)
  if (!column) return null

  return (
    <SheetScreen>
      <View>
        {OPTIONS.map((option) => {
          const current = option.id === column.color

          return (
            <Pressable
              key={option.id}
              disabled={current}
              onPress={() => {
                setColor({ id: column.id, color: option.id })
                router.back()
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: current }}
              className="flex-row items-center gap-3 rounded-xl px-3 py-3.5 active:bg-muted"
            >
              <ColumnSwatch color={option.id} />
              <Text className="flex-1 text-[17px] font-sans text-card-foreground">
                {option.label}
              </Text>
              {current ? <Check size={20} color={tokens.primary} /> : null}
            </Pressable>
          )
        })}
      </View>
    </SheetScreen>
  )
}
