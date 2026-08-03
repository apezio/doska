import type { ReactNode } from "react"
import { Text, View } from "react-native"

interface IProps {
  message: string
  /** The way out, where there is one — a button to make the missing thing. */
  children?: ReactNode
}

/** What a screen shows in place of a list it has nothing to put in. */
export function EmptyState({ message, children }: IProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8">
      <Text className="text-center text-muted-foreground">{message}</Text>
      {children}
    </View>
  )
}
