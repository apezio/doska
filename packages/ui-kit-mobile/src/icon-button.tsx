import type { LucideIcon } from "lucide-react-native"
import { Pressable } from "react-native"
import { useTokens } from "./tokens"

const VARIANT = {
  ghost: "rounded-lg p-1.5 active:bg-muted",
  plain: "p-1.5 active:opacity-40",
}

interface IProps {
  icon: LucideIcon
  /** There is no text to read out, so this is the button's whole name. */
  label: string
  variant?: keyof typeof VARIANT
  size?: number
  color?: string
  disabled?: boolean
  onPress: () => void
}

/** A bare icon as a button: a header action, a stepper, a toggle. */
export function IconButton({
  icon: Icon,
  label,
  variant = "ghost",
  size = 20,
  color,
  disabled,
  onPress,
}: IProps) {
  const tokens = useTokens()

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={disabled ? { opacity: 0.3 } : undefined}
      className={VARIANT[variant]}
    >
      <Icon size={size} color={color ?? tokens.mutedForeground} />
    </Pressable>
  )
}
