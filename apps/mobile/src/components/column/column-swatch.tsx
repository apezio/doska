import { columnSwatch } from "@doska/tokens/columns"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import { View } from "react-native"

/** A column's color as a dot; `""` is the dashed "no color" outline. */
export function ColumnSwatch({ color }: { color: string }) {
  const { dark } = useTokens()
  const swatch = columnSwatch(color, dark ? "dark" : "light")

  if (!swatch) {
    return (
      <View className="size-3 shrink-0 rounded-full border border-dashed border-muted-foreground" />
    )
  }

  return (
    <View
      className="size-3 shrink-0 rounded-full"
      style={{ backgroundColor: swatch.dot, borderColor: swatch.ring }}
    />
  )
}
