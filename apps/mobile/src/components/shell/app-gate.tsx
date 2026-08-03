import { Spinner } from "@doska/ui-kit-mobile"
import { useFonts } from "expo-font"
import { type ReactNode, useEffect, useState } from "react"
import { Text, View } from "react-native"
import { bootstrap } from "@/lib/bootstrap"
import { FONTS } from "@/lib/fonts"

interface IProps {
  children: ReactNode
}

/** Holds the app back until the database and the fonts are ready, and shows
 * why if the database never comes up. */
export function AppGate({ children }: IProps) {
  const [ready, setReady] = useState(false)
  const [failure, setFailure] = useState<Error | null>(null)
  const [fontsLoaded] = useFonts(FONTS)

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

  // Rendering before the fonts resolve flashes the system face and reflows.
  if (!ready || !fontsLoaded) {
    return (
      <View className="flex-1 bg-background">
        <Spinner />
      </View>
    )
  }

  return <>{children}</>
}
