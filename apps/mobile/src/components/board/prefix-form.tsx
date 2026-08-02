import { normalizePrefix } from "@doska/core/operations"
import { Input, SheetBar, SheetFootnote } from "@doska/ui-kit-mobile"
import { useState } from "react"
import { View } from "react-native"

interface IProps {
  prefix: string
  /** Other live boards' prefixes, for the uniqueness check. */
  taken: string[]
  onCommit: (prefix: string) => void
  onClose: () => void
}

/**
 * Edits the board's card-id prefix (the `ROAD` in `ROAD-12`). A prefix another
 * board uses is rejected: `PREFIX-N` has to be unambiguous.
 */
export function PrefixForm({ prefix, taken, onCommit, onClose }: IProps) {
  const [draft, setDraft] = useState(prefix)
  const [error, setError] = useState<string | null>(null)

  const takenUpper = new Set(
    taken.filter(Boolean).map((one) => one.toUpperCase())
  )

  function commit() {
    const next = normalizePrefix(draft)
    if (!next) {
      setError("Enter a prefix")
      return
    }
    if (takenUpper.has(next) && next !== prefix.toUpperCase()) {
      setError(`${next} is taken`)
      return
    }
    if (next !== prefix) onCommit(next)
    onClose()
  }

  const sample = draft || "PREFIX"

  return (
    <View>
      <SheetBar
        title="Card prefix"
        leading={{ label: "Cancel", onPress: onClose }}
        trailing={{ label: "Save", onPress: commit }}
      />

      <Input
        mono
        tone="secondary"
        invalid={Boolean(error)}
        className="mt-2"
        value={draft}
        autoFocus
        maxLength={6}
        autoCapitalize="characters"
        autoCorrect={false}
        accessibilityLabel="Board prefix"
        onChangeText={(value) => {
          setDraft(normalizePrefix(value))
          setError(null)
        }}
        onSubmitEditing={commit}
      />
      <SheetFootnote
        error={Boolean(error)}
        text={
          error ??
          `Every card on this board is numbered ${sample}-1, ${sample}-2, and so on.`
        }
      />
    </View>
  )
}
