import type { TrashEntry, TrashKind } from "@doska/core/operations"
import { Columns3, LayoutDashboard, StickyNote } from "lucide-react-native"
import { Pressable, Text, View } from "react-native"
import { useTokens } from "@/lib/tokens"

const ICONS: Record<TrashKind, typeof StickyNote> = {
  cards: StickyNote,
  columns: Columns3,
  dashboards: LayoutDashboard,
}

const DAY_MS = 24 * 60 * 60 * 1000

/** "29 days left" — rounded up, so the last day reads as a day rather than 0. */
function expiry(expiresAt: number): string {
  const days = Math.ceil((expiresAt - Date.now()) / DAY_MS)
  if (days <= 0) return "Deleting shortly"
  return days === 1 ? "1 day left" : `${days} days left`
}

interface IProps {
  entry: TrashEntry
  isRestoring: boolean
  onRestore: () => void
}

export function TrashRow({ entry, isRestoring, onRestore }: IProps) {
  const Icon = ICONS[entry.kind]
  const tokens = useTokens()

  return (
    <View className="flex-row items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
      <Icon size={16} color={tokens.mutedForeground} />
      <View className="min-w-0 flex-1">
        <Text
          numberOfLines={1}
          className="text-[15px] font-sans-medium text-card-foreground"
        >
          {entry.title || "Untitled"}
        </Text>
        <Text numberOfLines={1} className="text-xs text-muted-foreground">
          {entry.context}
          {entry.cardCount > 0
            ? ` · ${entry.cardCount} ${entry.cardCount === 1 ? "card" : "cards"}`
            : ""}
          {` · ${expiry(entry.expiresAt)}`}
        </Text>
      </View>
      <Pressable
        disabled={isRestoring}
        onPress={onRestore}
        className={
          isRestoring
            ? "rounded-lg bg-secondary px-3 py-1.5 opacity-40"
            : "rounded-lg bg-secondary px-3 py-1.5 active:opacity-70"
        }
      >
        <Text className="text-[13px] font-sans-medium text-secondary-foreground">
          Restore
        </Text>
      </Pressable>
    </View>
  )
}
