import { useDashboards, useDigest } from "@doska/core/queries"
import { sync } from "@doska/core/sync"
import { Spinner } from "@doska/ui-kit-mobile"
import { useFocusEffect } from "expo-router"
import { useCallback, useState } from "react"
import { Pressable, Text, View } from "react-native"
import { ScreenHeader, ScreenTitle } from "@/components/shell/screen-header"
import { UpcomingList } from "@/components/upcoming/upcoming-list"

export default function UpcomingScreen() {
  const { data } = useDigest("week")
  const { data: dashboards = [] } = useDashboards()
  const [hideDone, setHideDone] = useState(false)

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
        <Pressable
          onPress={() => setHideDone(!hideDone)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityState={{ selected: hideDone }}
          className={
            hideDone
              ? "rounded-lg bg-secondary px-2 py-1"
              : "rounded-lg px-2 py-1 active:bg-muted"
          }
        >
          <Text
            className={
              hideDone
                ? "text-[13px] font-sans-medium text-secondary-foreground"
                : "text-[13px] font-sans-medium text-muted-foreground"
            }
          >
            Hide done
          </Text>
        </Pressable>
      </ScreenHeader>

      {!data ? (
        <Spinner />
      ) : (
        <UpcomingList
          cards={data}
          hideDone={hideDone}
          boardIds={boardIds ? boardIds.split(",") : []}
        />
      )}
    </View>
  )
}
