import { useDashboards, useDigest } from "@doska/core/queries"
import { sync } from "@doska/core/sync"
import { Spinner } from "@doska/ui-kit-mobile"
import { useFocusEffect } from "expo-router"
import { useCallback } from "react"
import { View } from "react-native"
import { ScreenHeader, ScreenTitle } from "@/components/shell/screen-header"
import { UpcomingList } from "@/components/upcoming/upcoming-list"

export default function UpcomingScreen() {
  const { data } = useDigest("week")
  const { data: dashboards = [] } = useDashboards()

  // This view has to pull every board
  const boardIds = dashboards.map((dashboard) => dashboard.id).join(",")
  useFocusEffect(
    useCallback(() => {
      if (!boardIds) return
      void sync.watchBoards(boardIds.split(","))
      return () => void sync.watchBoards([])
    }, [boardIds])
  )

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader>
        <ScreenTitle>Upcoming</ScreenTitle>
      </ScreenHeader>

      {!data ? <Spinner /> : <UpcomingList cards={data} />}
    </View>
  )
}
