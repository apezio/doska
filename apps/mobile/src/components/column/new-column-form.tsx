import { Input, SheetBar } from "@doska/ui-kit-mobile"
import { useState } from "react"
import { View } from "react-native"

interface IProps {
  onCommit: (title: string) => void
  onClose: () => void
}

/** Names the column the web creates from its trailing "+". */
export function NewColumnForm({ onCommit, onClose }: IProps) {
  const [draft, setDraft] = useState("")

  function commit() {
    const title = draft.trim()
    if (!title) return
    onCommit(title)
    onClose()
  }

  return (
    <View>
      <SheetBar
        title="New column"
        leading={{ label: "Cancel", onPress: onClose }}
        trailing={{ label: "Add", onPress: commit }}
      />
      <Input
        tone="secondary"
        className="mt-2"
        value={draft}
        autoFocus
        autoCapitalize="sentences"
        placeholder="Column name"
        accessibilityLabel="Column name"
        returnKeyType="done"
        onChangeText={setDraft}
        onSubmitEditing={commit}
      />
    </View>
  )
}
