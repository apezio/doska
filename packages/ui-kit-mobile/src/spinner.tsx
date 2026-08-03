import { ActivityIndicator, View } from "react-native"

/** Fills whatever it is dropped into while a screen waits on its query. */
export function Spinner() {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator />
    </View>
  )
}
