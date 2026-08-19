import * as Haptics from "expo-haptics"
import Check from "lucide-react-native/icons/check"
import { Pressable, View } from "react-native"
import { cn } from "./lib/cn"
import { useTokens } from "./tokens"

interface IProps {
  checked: boolean
  onPress?: () => void
  className?: string
}

/** A markdown task's box. */
export function Checkbox({ checked, onPress, className }: IProps) {
  const { primaryForeground } = useTokens()

  const box = (
    <View
      className={cn(
        "size-5 items-center justify-center rounded-[5px] border",
        checked ? "border-primary bg-primary" : "border-input",
        className
      )}
    >
      {checked && <Check size={14} strokeWidth={3} color={primaryForeground} />}
    </View>
  )

  if (!onPress) return box

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress()
      }}
      hitSlop={10}
    >
      {box}
    </Pressable>
  )
}
