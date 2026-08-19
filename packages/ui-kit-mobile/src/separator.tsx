import { View } from "react-native"
import { cn } from "./lib/cn"

/** A hairline rule. */
export function Separator({ className }: { className?: string }) {
  return <View className={cn("h-px bg-border", className)} />
}
