import { IconButton } from "@doska/ui-kit-mobile"
import { DrawerActions } from "@react-navigation/native"
import { router, useNavigation } from "expo-router"
import Menu from "lucide-react-native/icons/menu"
import Search from "lucide-react-native/icons/search"
import type { ReactNode } from "react"
import { Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { OfflineBanner } from "@/components/shell/offline-banner"
import { ROUTES } from "@/lib/routes"

interface IProps {
  children?: ReactNode
}

/** Top bar of a screen: the drawer toggle, then whatever the screen puts beside
 * it, then search. The web's `PageHeader`, with a real button in place of its
 * sidebar rail. */
export function ScreenHeader({ children }: IProps) {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="shrink-0 border-b border-sidebar-border bg-sidebar"
    >
      <View className="h-[46px] flex-row items-center gap-2 px-3">
        <IconButton
          icon={Menu}
          label="Open menu"
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        />
        {children}
        <IconButton
          icon={Search}
          label="Search cards"
          onPress={() => router.push(ROUTES.search)}
        />
      </View>

      <OfflineBanner />
    </View>
  )
}

/** A screen's name in its header, where the screen has no editable title. */
export function ScreenTitle({ children }: { children: string }) {
  return (
    <Text className="flex-1 px-1 text-base font-sans-semibold text-sidebar-foreground">
      {children}
    </Text>
  )
}
