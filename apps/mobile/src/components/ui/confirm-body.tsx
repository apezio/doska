import { View } from "react-native"
import { SheetButton, SheetTitle } from "./sheet"

interface IProps {
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
}

/** The web's `ConfirmDialog`, as a sheet body. */
export function ConfirmBody({
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
}: IProps) {
  return (
    <View>
      <SheetTitle title={title} description={description} />
      <View className="mt-4 flex-row gap-2">
        <SheetButton label="Cancel" variant="ghost" onPress={onClose} />
        <SheetButton
          label={confirmLabel}
          variant="destructive"
          onPress={() => {
            onConfirm()
            onClose()
          }}
        />
      </View>
    </View>
  )
}
