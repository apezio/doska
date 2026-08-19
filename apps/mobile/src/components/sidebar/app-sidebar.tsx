import { useCreateDashboard } from "@doska/core/mutations"
import { Button } from "@doska/ui-kit-mobile"
import { DrawerActions } from "@react-navigation/native"
import { router, usePathname } from "expo-router"
import type { DrawerContentComponentProps } from "expo-router/drawer"
import Plus from "lucide-react-native/icons/plus"
import { ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ROUTES } from "@/lib/routes"
import { setLastBoard } from "@doska/core/last-board"
import { useActiveBoard } from "@/lib/use-active-board"
import { DashboardsList } from "./dashboards-list"
import { DocsButton } from "./docs-button"
import { GitHubButton } from "./github-button"
import { SidebarAccount } from "./sidebar-account"
import { SidebarButton } from "./sidebar-button"
import { ThemeToggle } from "./theme-toggle"
import { SidebarHeader } from "./sidebar-header"

export function AppSidebar({
  navigation,
}: {
  navigation: DrawerContentComponentProps["navigation"]
}) {
  const insets = useSafeAreaInsets()
  const pathname = usePathname()
  const { dashboards, deckId } = useActiveBoard()
  const { mutate: createDashboard } = useCreateDashboard()

  function go(href: (typeof ROUTES)["board" | "upcoming" | "trash"]) {
    router.navigate(href)
    navigation.dispatch(DrawerActions.closeDrawer())
  }

  function openSearch() {
    router.push(ROUTES.search)
    navigation.dispatch(DrawerActions.closeDrawer())
  }

  function openBoard(id: string) {
    setLastBoard(id)
    go(ROUTES.board)
  }

  return (
    <View
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      className="flex-1 bg-sidebar gap-2"
    >
      <SidebarHeader />

      <ScrollView contentContainerClassName="pb-4 gap-6">
        <View className="px-4 pb-2">
          <Button
            variant="secondary"
            icon={Plus}
            label="Add a dashboard"
            onPress={() =>
              createDashboard("Untitled board", {
                onSuccess: (created) => openBoard(created.id),
              })
            }
          />
        </View>

        <View className="gap-0.5 px-2">
          <SidebarButton label="Search" onPress={openSearch} />
          <SidebarButton
            label="Upcoming"
            isActive={pathname === ROUTES.upcoming}
            onPress={() => go(ROUTES.upcoming)}
          />
          <SidebarButton
            label="Trash"
            isActive={pathname === ROUTES.trash}
            onPress={() => go(ROUTES.trash)}
          />
        </View>

        <DashboardsList
          dashboards={dashboards}
          activeDashboardId={pathname === ROUTES.board ? deckId : null}
          onSelectDashboard={(dashboard) => openBoard(dashboard.id)}
        />
      </ScrollView>

      <View className="gap-0.5 border-t border-sidebar-border px-2 pt-2">
        <ThemeToggle />
        <DocsButton />
        <GitHubButton />
        <SidebarAccount />
      </View>
    </View>
  )
}
