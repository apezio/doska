import type { LucideIcon } from "lucide-react-native"
import type { ReactNode } from "react"
import { Modal, Pressable, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useKeyboardHeight } from "@/lib/use-keyboard-height"
import { useTokens } from "@/lib/tokens"

interface ISheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
}

/**
 * The mobile stand-in for the web's menus and modals: everything slides up from
 * the bottom edge, which is the only place a thumb reliably reaches.
 *
 * One sheet holds one screen's worth of content at a time — swapping the
 * children rather than stacking a second `Modal` over the first, which iOS
 * animates badly when a menu opens a dialog.
 */
export function Sheet({ open, onClose, children }: ISheetProps) {
  const insets = useSafeAreaInsets()
  const keyboard = useKeyboardHeight()

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      statusBarTranslucent
      // Android's back gesture, which otherwise leaves the sheet up.
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View
        style={{ paddingBottom: (keyboard || insets.bottom) + 12 }}
        className="rounded-t-3xl border-t border-border bg-card px-4 pt-3"
      >
        <View className="mb-3 h-1 w-10 self-center rounded-full bg-border" />
        {children}
      </View>
    </Modal>
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
