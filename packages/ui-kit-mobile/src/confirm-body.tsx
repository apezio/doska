import { View } from "react-native"
import { SheetAction } from "./sheet"
import { Text } from "./text"

interface IProps {
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  /** Where confirming leaves you. */
  onClose: () => void
  /** Where cancelling leaves you, when that is somewhere else — confirming can
   * dismiss a screen that cancelling has to leave standing. */
  onCancel?: () => void
}

/** The web's `ConfirmDialog` as an iOS action sheet: the question centred and
 * quiet above, the destructive choice and the way out stacked below it. */
export function ConfirmBody({
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
  onCancel = onClose,
}: IProps) {
  return (
    <View>
      <View className="px-6 pb-4 pt-1">
        <Text className="text-center text-subheadline font-sans-semibold text-card-foreground">
          {title}
        </Text>
        <Text className="mt-1 text-center text-footnote leading-[18px] text-muted-foreground">
          {description}
        </Text>
      </View>

      <SheetAction
        label={confirmLabel}
        role="destructive"
        onPress={() => {
          onConfirm()
          onClose()
        }}
      />
      {/* Its own group: on iOS the gap is what sets cancel apart. */}
      <View className="h-2" />
      <SheetAction label="Cancel" role="cancel" onPress={onCancel} />
    </View>
  )
}
