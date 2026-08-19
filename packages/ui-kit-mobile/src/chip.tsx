import type { ReactNode } from "react"
import { View } from "react-native"
import { cn } from "./lib/cn"

/** A small rounded label — a deadline, a column name. Carries no background of
 * its own, so the caller's tone class never has to win a conflict. */
export function Chip({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <View
      className={cn(
        "flex-row items-center gap-1.5 rounded-full px-2 py-0.5",
        className
      )}
    >
      {children}
    </View>
  )
}
