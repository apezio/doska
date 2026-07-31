import "@/lib/adapters/install" // must stay first
import "../global.css"

import { onSessionExpired } from "@doska/core/auth"
import { keys } from "@doska/core/keys"
import { queryClient } from "@doska/core/query-client"
import {
  GeistMono_400Regular,
  GeistMono_500Medium,
} from "@expo-google-fonts/geist-mono"
import {
  Mulish_400Regular,
  Mulish_500Medium,
  Mulish_600SemiBold,
  Mulish_700Bold,
} from "@expo-google-fonts/mulish"
import { QueryClientProvider } from "@tanstack/react-query"
import { useFonts } from "expo-font"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import { ActivityIndicator, Text, View } from "react-native"
import { bootstrap } from "@/lib/bootstrap"
import { useTokens } from "@/lib/tokens"

onSessionExpired(() => {
  queryClient.setQueryData(keys.session, { authed: false, login: null })
})

// Keys become family names, so they must match `fontFamily` in tailwind.config.js.
const FONTS = {
  Mulish_400Regular,
  Mulish_500Medium,
  Mulish_600SemiBold,
  Mulish_700Bold,
  GeistMono_400Regular,
  GeistMono_500Medium,
}

export default function RootLayout() {
  const [ready, setReady] = useState(false)
  const [failure, setFailure] = useState<Error | null>(null)
  const [fontsLoaded] = useFonts(FONTS)
  const tokens = useTokens()

  // The native header is not a React Native view, so it takes tokens as values.
  const headerOptions = {
    headerStyle: { backgroundColor: tokens.card },
    headerTitleStyle: { color: tokens.foreground, fontFamily: "Mulish_600SemiBold" },
    headerTintColor: tokens.primary,
  }

  useEffect(() => {
    bootstrap().then(
      () => setReady(true),
      (error: Error) => setFailure(error)
    )
  }, [])

  if (failure) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="p-6 text-center font-sans text-destructive">
          {failure.message}
        </Text>
      </View>
    )
  }

  // Rendering before the fonts resolve would flash the system face and reflow.
  if (!ready || !fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack screenOptions={headerOptions}>
        {/* Both screens draw their own header, matching the web's. */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="upcoming" options={{ title: "Upcoming" }} />
        <Stack.Screen
          name="card/[id]"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="sign-in"
          options={{ title: "Sync", presentation: "modal" }}
        />
      </Stack>
    </QueryClientProvider>
  )
}
