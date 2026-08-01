import { DrawerActions } from "@react-navigation/native"
import { useNavigation } from "expo-router"
import { Menu } from "lucide-react-native"
import type { ReactNode } from "react"
import { Pressable, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTokens } from "@/lib/tokens"

interface IProps {
  children?: ReactNode
}

/** Top bar of a screen: the drawer toggle, then whatever the screen puts beside
 * it. The web's `PageHeader`, with a real button in place of its sidebar rail. */
export function ScreenHeader({ children }: IProps) {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const tokens = useTokens()

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="shrink-0 border-b border-sidebar-border bg-sidebar"
    >
      <View className="h-[46px] flex-row items-center gap-2 px-3">
        <Pressable
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          className="rounded-lg p-1.5 active:bg-muted"
        >
          <Menu size={20} color={tokens.mutedForeground} />
        </Pressable>
        {children}
      </View>
    </View>
  )
}
