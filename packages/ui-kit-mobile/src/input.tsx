import { TextInput, type TextInputProps } from "react-native"
import { cn } from "./lib/cn"
import { useTokens } from "./tokens"

/**
 * A `TextInput` with the placeholder colour resolved from the theme — the one
 * thing every field in the app has to set, and the one thing NativeWind cannot
 * set from a class.
 */
export function TextField({ className, ...props }: TextInputProps) {
  const tokens = useTokens()

  return (
    <TextInput
      placeholderTextColor={tokens.mutedForeground}
      className={className}
      {...props}
    />
  )
}

const TONE = {
  card: "bg-card",
  secondary: "bg-secondary",
}

interface IProps extends TextInputProps {
  /** Draws the border in the destructive colour; the message goes beside it. */
  invalid?: boolean
  /** Which surface the field is inset on. */
  tone?: keyof typeof TONE
  mono?: boolean
}

/** A boxed, bordered field — the form input. */
export function Input({
  invalid,
  tone = "card",
  mono,
  className,
  ...props
}: IProps) {
  return (
    <TextField
      className={cn(
        "rounded-xl border px-3 py-3 text-card-foreground",
        mono ? "font-mono text-callout" : "text-subheadline",
        invalid ? "border-destructive" : "border-border",
        TONE[tone],
        className
      )}
      {...props}
    />
  )
}
