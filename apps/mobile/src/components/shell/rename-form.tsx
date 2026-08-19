import { Input, SheetBar } from "@doska/ui-kit-mobile"
import { useState } from "react"
import { View } from "react-native"

interface IProps {
  title: string
  value: string
  placeholder: string
  label: string
  onCommit: (value: string) => void
  onClose: () => void
}

export function RenameForm({
  title,
  value,
  placeholder,
  label,
  onCommit,
  onClose,
}: IProps) {
  const [draft, setDraft] = useState(value)

  function commit() {
    const next = draft.trim()
    if (next && next !== value) onCommit(next)
    onClose()
  }

  return (
    <View>
      <SheetBar
        title={title}
        leading={{ label: "Cancel", onPress: onClose }}
        trailing={{ label: "Save", onPress: commit }}
      />
      <Input
        tone="secondary"
        className="mt-2"
        value={draft}
        autoFocus
        selectTextOnFocus
        autoCapitalize="sentences"
        placeholder={placeholder}
        accessibilityLabel={label}
        returnKeyType="done"
        onChangeText={setDraft}
        onSubmitEditing={commit}
      />
    </View>
  )
}
