import { columnSwatch } from "@doska/tokens/columns"
import { cn } from "@doska/ui-kit-mobile"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import { View } from "react-native"

interface IProps {
  color: string
  /** Draws an uncolored column as a plain grey dot. In a picker the dashed
   * outline means "no color", but in a list of cards it is only a bullet. */
  neutral?: boolean
}

/** A column's color as a dot; `""` is the dashed "no color" outline. */
export function ColumnSwatch({ color, neutral }: IProps) {
  const { dark } = useTokens()
  const swatch = columnSwatch(color, dark ? "dark" : "light")

  if (!swatch) {
    return (
      <View
        className={cn(
          "size-3 shrink-0 rounded-full",
          neutral
            ? "bg-column-neutral"
            : "border border-dashed border-muted-foreground"
        )}
      />
    )
  }

  return (
    <View
      className="size-3 shrink-0 rounded-full"
      style={{ backgroundColor: swatch.dot, borderColor: swatch.ring }}
    />
  )
}
