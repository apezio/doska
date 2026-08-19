import type { Dashboard } from "@doska/core/types"
import { Text } from "@doska/ui-kit-mobile"
import { View } from "react-native"
import { SidebarButton } from "./sidebar-button"

interface IProps {
  dashboards: Dashboard[]
  activeDashboardId: string | null
  onSelectDashboard: (dashboard: Dashboard) => void
}

export function DashboardsList({
  dashboards,
  activeDashboardId,
  onSelectDashboard,
}: IProps) {
  if (!dashboards.length) return null

  return (
    <View className="gap-0.5 px-2 pt-4">
      <Text className="px-2 pb-1 text-xs font-sans-medium text-muted-foreground">
        Dashboards
      </Text>
      {dashboards.map((dashboard) => (
        <SidebarButton
          key={dashboard.id}
          label={dashboard.title || "Untitled board"}
          isActive={dashboard.id === activeDashboardId}
          onPress={() => onSelectDashboard(dashboard)}
        />
      ))}
    </View>
  )
}
