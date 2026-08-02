import * as Haptics from "expo-haptics"
import { Pressable, Text, View } from "react-native"

interface IProps {
  checked: boolean
  /** Omitted where the checkbox is only a readout, as on a board card. */
  onPress?: () => void
  className?: string
}

/** A markdown task's box. */
export function Checkbox({ checked, onPress, className }: IProps) {
  const box = (
    <View
      className={[
        "size-4 items-center justify-center rounded-[4px] border",
        checked ? "border-primary bg-primary" : "border-input",
        className ?? "",
      ].join(" ")}
    >
      {checked ? (
        <Text className="text-[10px] leading-[12px] text-primary-foreground">
          ✓
        </Text>
      ) : null}
    </View>
  )

  if (!onPress) return box

  // Widens the touch target without moving the box.
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
