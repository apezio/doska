import "@/lib/adapters/install" // must stay first
import "../global.css"

import { onSessionExpired } from "@doska/core/auth"
import { keys } from "@doska/core/keys"
import { queryClient } from "@doska/core/query-client"
import { QueryClientProvider } from "@tanstack/react-query"
import { Link, Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import { ActivityIndicator, Text, View } from "react-native"
import { bootstrap } from "@/lib/bootstrap"
import { SyncLink } from "@/components/sync-link"

onSessionExpired(() => {
  queryClient.setQueryData(keys.session, { authed: false, login: null })
})

export default function RootLayout() {
  const [ready, setReady] = useState(false)
  const [failure, setFailure] = useState<Error | null>(null)

  useEffect(() => {
    bootstrap().then(
      () => setReady(true),
      (error: Error) => setFailure(error)
    )
  }, [])

  if (failure) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-950">
        <Text className="p-6 text-center text-red-600">{failure.message}</Text>
      </View>
    )
  }

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-950">
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: "Board",
            headerLeft: () => <SyncLink />,
            headerRight: () => (
              <Link href="/upcoming" className="text-base text-blue-600">
                Upcoming
              </Link>
            ),
          }}
        />
        <Stack.Screen name="upcoming" options={{ title: "Upcoming" }} />
        <Stack.Screen
          name="card/[id]"
          options={{ title: "Card", presentation: "modal" }}
        />
        <Stack.Screen
          name="sign-in"
          options={{ title: "Sync", presentation: "modal" }}
        />
      </Stack>
    </QueryClientProvider>
  )
}
