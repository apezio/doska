import { SheetBar, SheetFootnote, Text } from "@doska/ui-kit-mobile"
import { View } from "react-native"
import { DoneColumnPicker } from "./done-column-picker"

interface IProps {
  boardId: string
  onClose: () => void
}

/** Why a tick did nothing, and the one tap that fixes it — the web's
 * `DoneColumnHelp` dialog as a sheet. */
export function DoneColumnHelp({ boardId, onClose }: IProps) {
  return (
    <View>
      <SheetBar
        title="No done column"
        leading={{ label: "Not now", onPress: onClose }}
      />

      <Text className="px-3 pb-3 text-subheadline leading-[20px] text-muted-foreground">
        Marking a card done moves it to its board's done column, so a board
        without one has nowhere to put it.
      </Text>

      <DoneColumnPicker boardId={boardId} onPicked={onClose} />

      <SheetFootnote text="You can change this later from the column's ⋯ menu on the board." />
    </View>
  )
}
