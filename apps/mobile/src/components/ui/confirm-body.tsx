import { Text, View } from "react-native"
import { SheetAction } from "./sheet"

interface IProps {
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
}

/** The web's `ConfirmDialog` as an iOS action sheet: the question centred and
 * quiet above, the destructive choice and the way out stacked below it. */
export function ConfirmBody({
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
}: IProps) {
  return (
    <View>
      <View className="px-6 pb-4 pt-1">
        <Text className="text-center text-[15px] font-sans-semibold text-card-foreground">
          {title}
        </Text>
        <Text className="mt-1 text-center text-[13px] leading-[18px] text-muted-foreground">
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
      <SheetAction label="Cancel" role="cancel" onPress={onClose} />
    </View>
  )
}
