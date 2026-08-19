import { useUpdateCard } from "@doska/core/mutations"
import { useCard } from "@doska/core/queries"
import { PRIORITIES } from "@doska/tokens/priority"
import { PriorityChip, SheetScreen, Text } from "@doska/ui-kit-mobile"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import { router, useLocalSearchParams } from "expo-router"
import Check from "lucide-react-native/icons/check"
import { Pressable, View } from "react-native"

/** None first, the way the web's priority menu lists it. */
const OPTIONS = [{ id: "", label: "No priority" }, ...PRIORITIES]

export default function CardPrioritySheet() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return id ? <Body cardId={id} /> : null
}

function Body({ cardId }: { cardId: string }) {
  const tokens = useTokens()
  const { data: card } = useCard(cardId)
  const { mutate: updateCard } = useUpdateCard(cardId)
  if (!card) return null

  return (
    <SheetScreen>
      <View>
        {OPTIONS.map((option) => {
          const current = option.id === card.priority

          return (
            <Pressable
              key={option.id}
              disabled={current}
              onPress={() => {
                updateCard({ priority: option.id })
                router.back()
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: current }}
              className="flex-row items-center gap-3 rounded-xl px-3 py-3.5 active:bg-muted"
            >
              <PriorityChip value={option.id} size={20} />
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
