import type { LucideIcon } from "lucide-react-native"
import type { ReactNode } from "react"
import { Pressable, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTokens } from "@/lib/tokens"

/**
 * The content of a sheet route. The sheet itself — its height, its grabber, its
 * dismiss gesture, its scrim — is the native form sheet configured on the route
 * in `app/_layout.tsx`; this only pads what sits inside it.
 *
 * Must not stretch: the route's detent is `fitToContents`, which measures this.
 */
export function SheetScreen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets()

  return (
    <View
      style={{ paddingBottom: insets.bottom + 12 }}
      className="bg-card px-4 pt-4"
    >
      {children}
    </View>
  )
}

export function SheetTitle({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <View className="px-1 pb-2">
      <Text className="text-base font-sans-semibold text-card-foreground">
        {title}
      </Text>
      {description ? (
        <Text className="mt-1 text-[13px] leading-5 text-muted-foreground">
          {description}
        </Text>
      ) : null}
    </View>
  )
}

interface IItemProps {
  icon: LucideIcon
  label: string
  /** Right-aligned hint, the way the web menu shows the current prefix. */
  trailing?: string
  disabled?: boolean
  destructive?: boolean
  onPress: () => void
}

export function SheetItem({
  icon: Icon,
  label,
  trailing,
  disabled,
  destructive,
  onPress,
}: IItemProps) {
  const tokens = useTokens()
  const color = destructive ? tokens.destructive : tokens.cardForeground

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className={
        disabled
          ? "flex-row items-center gap-3 rounded-xl px-3 py-3.5 opacity-40"
          : "flex-row items-center gap-3 rounded-xl px-3 py-3.5 active:bg-muted"
      }
    >
      <Icon size={18} color={color} />
      <Text style={{ color }} className="flex-1 text-[15px] font-sans-medium">
        {label}
      </Text>
      {trailing ? (
        <Text className="font-mono text-[13px] text-muted-foreground">
          {trailing}
        </Text>
      ) : null}
    </Pressable>
  )
}

const SURFACE = {
  primary: "bg-primary active:opacity-80",
  ghost: "active:bg-muted",
  destructive: "bg-destructive active:opacity-80",
}

const LABEL = {
  primary: "text-primary-foreground",
  ghost: "text-muted-foreground",
  destructive: "text-primary-foreground",
}

interface IButtonProps {
  label: string
  variant?: keyof typeof SURFACE
  disabled?: boolean
  onPress: () => void
}

export function SheetButton({
  label,
  variant = "primary",
  disabled,
  onPress,
}: IButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={disabled ? { opacity: 0.4 } : undefined}
      className={`flex-1 items-center rounded-xl px-4 py-3 ${SURFACE[variant]}`}
    >
      <Text className={`text-[15px] font-sans-medium ${LABEL[variant]}`}>
        {label}
      </Text>
    </Pressable>
  )
}
