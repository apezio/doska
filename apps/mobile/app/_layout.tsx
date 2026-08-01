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
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { bootstrap } from "@/lib/bootstrap"
import { restoreTheme } from "@/lib/theme"
import { useTokens } from "@/lib/tokens"

onSessionExpired(() => {
  queryClient.setQueryData(keys.session, { authed: false, login: null })
})

// Before the first render, so a chosen theme never flashes the device's one.
restoreTheme()

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
    headerTitleStyle: {
      color: tokens.foreground,
      fontFamily: "Mulish_600SemiBold",
    },
    headerTintColor: tokens.primary,
  }

  useEffect(() => {
    bootstrap().then(
      () => setReady(true),
      (error: Error) => setFailure(error)
    )
  }, [])

  return (
    // The drawer's swipe and its overlay both come from gesture-handler, which
    // needs this at the very root to receive touches. Both wrappers stay above
    // the gates: a screen must never mount — even for one render — outside the
    // provider its hooks read.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        {failure ? (
          <View className="flex-1 items-center justify-center bg-background">
            <Text className="p-6 text-center font-sans text-destructive">
              {failure.message}
            </Text>
          </View>
        ) : !ready || !fontsLoaded ? (
          // Rendering before the fonts resolve flashes the system face and reflows.
          <View className="flex-1 items-center justify-center bg-background">
            <ActivityIndicator />
          </View>
        ) : (
          <>
            <StatusBar style="auto" />
            <Stack screenOptions={headerOptions}>
              {/* The sidebar's screens draw their own headers, matching the web's. */}
              <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
              <Stack.Screen
                name="card/[id]"
                options={{ headerShown: false, presentation: "modal" }}
              />
              <Stack.Screen
                name="sign-in"
                options={{ title: "Sync", presentation: "modal" }}
              />
            </Stack>
          </>
        )}
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
