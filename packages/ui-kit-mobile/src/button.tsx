import type { LucideIcon } from "lucide-react-native"
import { Pressable, Text } from "react-native"
import { useTokens } from "./tokens"

const SURFACE = {
  primary: "bg-primary",
  secondary: "bg-secondary",
}

const LABEL = {
  primary: "text-primary-foreground",
  secondary: "text-secondary-foreground",
}

const SIZE = {
  md: { box: "rounded-xl px-4 py-3", label: "text-[15px]", icon: 16 },
  sm: { box: "rounded-lg px-3 py-1.5", label: "text-[13px]", icon: 14 },
}

interface IProps {
  label: string
  icon?: LucideIcon
  variant?: keyof typeof SURFACE
  size?: keyof typeof SIZE
  disabled?: boolean
  onPress: () => void
}

/** A filled button with a label — the web's `Button`, in its two used tones. */
export function Button({
  label,
  icon: Icon,
  variant = "primary",
  size = "md",
  disabled,
  onPress,
}: IProps) {
  const tokens = useTokens()
  const metrics = SIZE[size]

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={[
        "flex-row items-center justify-center gap-1.5",
        metrics.box,
        SURFACE[variant],
        disabled ? "opacity-40" : "active:opacity-70",
      ].join(" ")}
    >
      {Icon ? (
        <Icon
          size={metrics.icon}
          color={
            variant === "primary" ? tokens.primaryForeground : tokens.foreground
          }
        />
      ) : null}
      <Text className={`font-sans-medium ${metrics.label} ${LABEL[variant]}`}>
        {label}
      </Text>
    </Pressable>
  )
}
