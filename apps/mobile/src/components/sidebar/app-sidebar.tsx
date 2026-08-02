import { useCreateDashboard } from "@doska/core/mutations"
import { DrawerActions } from "@react-navigation/native"
import Constants from "expo-constants"
import { router, usePathname } from "expo-router"
import type { DrawerContentComponentProps } from "expo-router/drawer"
import { Anchor, CalendarClock, Plus, Trash2 } from "lucide-react-native"
import { Pressable, ScrollView, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTokens } from "@/lib/tokens"
import { selectBoard, useActiveBoard } from "@/lib/use-active-board"
import { DashboardsList } from "./dashboards-list"
import { GitHubButton } from "./github-button"
import { SidebarAccount } from "./sidebar-account"
import { SidebarButton } from "./sidebar-button"
import { ThemeToggle } from "./theme-toggle"

/** `navigation` comes from the drawer's own `drawerContent` props: the sidebar
 * renders in the parent navigator's context, so a `useNavigation()` here would
 * dispatch `CLOSE_DRAWER` upwards, where no drawer handles it. */
export function AppSidebar({
  navigation,
}: {
  navigation: DrawerContentComponentProps["navigation"]
}) {
  const insets = useSafeAreaInsets()
  const pathname = usePathname()
  const tokens = useTokens()
  const { dashboards, deckId } = useActiveBoard()
  const { mutate: createDashboard } = useCreateDashboard()

  // Navigating from inside the drawer does not dismiss it; the drawer is its own
  // navigator and the route change happens underneath it.
  function go(href: "/" | "/upcoming" | "/trash") {
    router.navigate(href)
    navigation.dispatch(DrawerActions.closeDrawer())
  }

  function openBoard(id: string) {
    selectBoard(id)
    go("/")
  }

  return (
    <View
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      className="flex-1 bg-sidebar"
    >
      <View className="flex-row items-center gap-2 px-4 py-3">
        <Anchor size={16} color={tokens.foreground} />
        <Text className="text-base font-sans-semibold text-sidebar-foreground">
          Doska
        </Text>
        <Text className="text-[13px] text-muted-foreground/50">
          {Constants.expoConfig?.version ?? ""}
        </Text>
      </View>

      <ScrollView contentContainerClassName="pb-4">
        <View className="px-4 pb-2">
          <Pressable
            onPress={() =>
              createDashboard("Untitled board", {
                onSuccess: (created) => openBoard(created.id),
              })
            }
            className="flex-row items-center justify-center gap-1.5 rounded-lg bg-secondary px-3 py-2.5 active:opacity-70"
          >
            <Plus size={16} color={tokens.foreground} />
            <Text className="text-[15px] font-sans-medium text-sidebar-foreground">
              Add a dashboard
            </Text>
          </Pressable>
        </View>

        <View className="gap-0.5 px-2">
          <SidebarButton
            icon={CalendarClock}
            label="Upcoming"
            isActive={pathname === "/upcoming"}
            onPress={() => go("/upcoming")}
          />
          <SidebarButton
            icon={Trash2}
            label="Trash"
            isActive={pathname === "/trash"}
            onPress={() => go("/trash")}
          />
        </View>

        <DashboardsList
          dashboards={dashboards}
          activeDashboardId={pathname === "/" ? deckId : null}
          onSelectDashboard={(dashboard) => openBoard(dashboard.id)}
        />
      </ScrollView>

      <View className="gap-0.5 border-t border-sidebar-border px-2 pt-2">
        <ThemeToggle />
        <GitHubButton />
        <SidebarAccount />
      </View>
    </View>
  )
}
