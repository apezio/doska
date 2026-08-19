import { useSetDashboardSort } from "@doska/core/mutations"
import type { Dashboard } from "@doska/core/types"
import { SheetFootnote, Text } from "@doska/ui-kit-mobile"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import { SORT_MODES } from "@doska/core/utils"
import Check from "lucide-react-native/icons/check"
import { Pressable, View } from "react-native"
import { SORT_ICONS } from "./sort-icons"

/** The board's sort modes, the web's `⋯` sort menu as a sheet. Several can be
 * on at once: they apply in the order they were picked. */
export function BoardSort({ board }: { board: Dashboard }) {
  const tokens = useTokens()
  const { mutate: setDashboardSort } = useSetDashboardSort()
  const sort = board.sort ?? []

  function toggle(key: string) {
    const next = sort.includes(key)
      ? sort.filter((one) => one !== key)
      : [...sort, key]
    setDashboardSort({ id: board.id, sort: next })
  }

  return (
    <View>
      {SORT_MODES.map(({ id, label }) => {
        const selected = sort.includes(id)
        const Icon = SORT_ICONS[id]

        return (
          <Pressable
            key={id}
            onPress={() => toggle(id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className="flex-row items-center gap-3 rounded-xl px-3 py-3.5 active:bg-muted"
          >
            <Icon size={20} color={tokens.cardForeground} />
            <Text className="flex-1 text-[17px] font-sans text-card-foreground">
              Sort by {label.toLowerCase()}
            </Text>
            {selected ? <Check size={20} color={tokens.primary} /> : null}
          </Pressable>
        )
      })}
      <SheetFootnote text="With none picked, cards stay in the order they were dragged into." />
    </View>
  )
}
