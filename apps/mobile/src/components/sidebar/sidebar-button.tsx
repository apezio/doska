import type { LucideIcon } from "lucide-react-native"
import { Pressable, Text } from "react-native"
import { useTokens } from "@/lib/tokens"

interface IProps {
  icon?: LucideIcon
  label: string
  isActive?: boolean
  onPress: () => void
}

/** One row in the sidebar — the web's `SidebarMenuButton`. */
export function SidebarButton({
  icon: Icon,
  label,
  isActive,
  onPress,
}: IProps) {
  const tokens = useTokens()

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      className={
        isActive
          ? "flex-row items-center gap-2 rounded-lg bg-sidebar-accent px-2 py-2"
          : "flex-row items-center gap-2 rounded-lg px-2 py-2 active:bg-muted"
      }
    >
      {Icon ? (
        <Icon
          size={16}
          color={isActive ? tokens.primary : tokens.mutedForeground}
        />
      ) : null}
      <Text
        numberOfLines={1}
        className={
          isActive
            ? "flex-1 text-[15px] font-sans-medium text-sidebar-accent-foreground"
            : "flex-1 text-[15px] font-sans text-sidebar-foreground"
        }
      >
        {label}
      </Text>
    </Pressable>
  )
}
