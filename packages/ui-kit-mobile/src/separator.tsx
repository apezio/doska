import { View } from "react-native"

/** A hairline rule. */
export function Separator({ className }: { className?: string }) {
  return <View className={`h-px bg-border ${className ?? ""}`} />
}
