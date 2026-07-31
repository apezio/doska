import type { Dashboard } from "@doska/core/types"
import { Link } from "expo-router"
import { Pressable, ScrollView, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { SyncLink } from "@/components/sync-link"

interface IProps {
  dashboards: Dashboard[]
  deckId: string | null
  onSelect: (id: string) => void
}

/**
 * The board's top bar: the web's board name on the left and its actions on the
 * right. With no sidebar to toggle, the boards themselves become the switcher
 * and take the name's place once there is more than one.
 */
export function BoardHeader({ dashboards, deckId, onSelect }: IProps) {
  const insets = useSafeAreaInsets()
  const active = dashboards.find((dashboard) => dashboard.id === deckId)

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="shrink-0 border-b border-sidebar-border"
    >
      <View className="h-[46px] flex-row items-center gap-3 px-4">
        {dashboards.length < 2 ? (
          <Text
            numberOfLines={1}
            className="flex-1 text-base font-sans-semibold text-sidebar-foreground"
          >
            {active?.title ?? ""}
          </Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-1"
            contentContainerClassName="items-center gap-1"
          >
            {dashboards.map((dashboard) => {
              const isActive = dashboard.id === deckId
              return (
                <Pressable
                  key={dashboard.id}
                  onPress={() => onSelect(dashboard.id)}
                  className={
                    isActive
                      ? "rounded-lg bg-sidebar-accent px-2.5 py-1"
                      : "rounded-lg px-2.5 py-1"
                  }
                >
                  <Text
                    className={
                      isActive
                        ? "text-base font-sans-semibold text-sidebar-accent-foreground"
                        : "text-base font-sans-medium text-muted-foreground"
                    }
                  >
                    {dashboard.title}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>
        )}

        <SyncLink />
        <Link href="/upcoming" className="text-base font-sans-medium text-primary">
          Upcoming
        </Link>
      </View>
    </View>
  )
}
