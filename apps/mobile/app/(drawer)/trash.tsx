import { useRestore } from "@doska/core/mutations"
import { purgeExpired } from "@doska/core/operations"
import { useDashboards, useTrash } from "@doska/core/queries"
import { sync } from "@doska/core/sync"
import { useFocusEffect } from "expo-router"
import { useCallback, useEffect } from "react"
import { ActivityIndicator, FlatList, Text, View } from "react-native"
import { TrashRow } from "@/components/trash/trash-row"
import { ScreenHeader } from "@/components/ui/screen-header"

/**
 * Everything deleted across every board, newest first. Like the digest it pulls
 * every board, not just the open one — a tombstone the client never pulled is
 * not in the trash.
 */
export default function TrashScreen() {
  const { data: dashboards = [] } = useDashboards()
  const { data: entries = [], isPending, error, refetch } = useTrash()
  const { mutate: restore, variables, isPending: isRestoring } = useRestore()

  // The trash spans every board, so it drops the single-board scope while it is
  // the screen in front. The board screen takes it back on its way in.
  useFocusEffect(
    useCallback(() => {
      sync.setActiveBoard(null)
    }, [])
  )

  const boardIds = dashboards.map((dashboard) => dashboard.id).join(",")
  useEffect(() => {
    if (!boardIds) return
    void sync.reconcileBoards(boardIds.split(","))
  }, [boardIds])

  // Opening the trash is the moment stale entries would be visible, so sweep
  // first and re-read whatever the sweep removed.
  useEffect(() => {
    void purgeExpired().then((purged) => {
      if (purged > 0) void refetch()
    })
  }, [refetch])

  const restoringId = isRestoring ? (variables?.id ?? null) : null

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader>
        <Text className="flex-1 px-1 text-base font-sans-semibold text-sidebar-foreground">
          Trash
        </Text>
      </ScreenHeader>

      {error ? (
        <Centered>
          Couldn&apos;t read the trash. Close the app and open it again.
        </Centered>
      ) : isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : entries.length === 0 ? (
        <Centered>The trash is empty.</Centered>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(entry) => `${entry.kind}/${entry.id}`}
          contentContainerClassName="gap-2 p-3"
          ListHeaderComponent={
            <Text className="pb-1 text-[13px] text-muted-foreground">
              Items here are permanently deleted after 14 days.
            </Text>
          }
          renderItem={({ item }) => (
            <TrashRow
              entry={item}
              isRestoring={restoringId === item.id}
              onRestore={() => restore({ kind: item.kind, id: item.id })}
            />
          )}
        />
      )}
    </View>
  )
}

function Centered({ children }: { children: string }) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="text-center text-muted-foreground">{children}</Text>
    </View>
  )
}
