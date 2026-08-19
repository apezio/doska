import { cn, Text } from "@doska/ui-kit-mobile"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import type { LucideIcon } from "lucide-react-native"
import { Pressable } from "react-native"

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
      className={cn(
        "flex-row items-center gap-2 rounded-lg px-2 py-2",
        isActive ? "bg-sidebar-accent" : "active:bg-muted"
      )}
    >
      {!!Icon && (
        <Icon
          size={16}
          color={isActive ? tokens.primary : tokens.mutedForeground}
        />
      )}
      <Text
        numberOfLines={1}
        className={cn(
          "flex-1 text-subheadline",
          isActive
            ? "font-sans-medium text-sidebar-accent-foreground"
            : "font-sans text-sidebar-foreground"
        )}
      >
        {label}
      </Text>
    </Pressable>
  )
}
