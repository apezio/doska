import { Calendar, SheetAction, SheetBar } from "@doska/ui-kit-mobile"
import { useState } from "react"
import { View } from "react-native"

interface IProps {
  value: string | null
  onCommit: (value: string | null) => void
  onClose: () => void
}

/** Picks a card's deadline — the web's `DateInput` calendar, with its Clear and
 * Save. The pick is a draft until saved, so a mis-tap costs nothing. */
export function DeadlineForm({ value, onCommit, onClose }: IProps) {
  const [draft, setDraft] = useState(value)

  return (
    <View>
      <SheetBar
        title="Due date"
        leading={{ label: "Cancel", onPress: onClose }}
        trailing={{
          label: "Save",
          onPress: () => {
            if (draft !== value) onCommit(draft)
            onClose()
          },
        }}
      />

      <Calendar value={draft} onSelect={setDraft} />

      {draft ? (
        <SheetAction
          label="Clear date"
          role="destructive"
          onPress={() => setDraft(null)}
        />
      ) : null}
    </View>
  )
}
