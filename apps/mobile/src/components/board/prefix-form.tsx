import { normalizePrefix } from "@doska/core/operations"
import { useState } from "react"
import { Text, TextInput, View } from "react-native"
import { SheetButton, SheetTitle } from "@/components/ui/sheet"
import { useTokens } from "@/lib/tokens"

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
  const tokens = useTokens()

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
      <SheetTitle
        title="Card prefix"
        description={`Every card on this board is numbered ${sample}-1, ${sample}-2, and so on.`}
      />

      <TextInput
        value={draft}
        autoFocus
        maxLength={6}
        autoCapitalize="characters"
        autoCorrect={false}
        accessibilityLabel="Board prefix"
        placeholderTextColor={tokens.mutedForeground}
        onChangeText={(value) => {
          setDraft(normalizePrefix(value))
          setError(null)
        }}
        onSubmitEditing={commit}
        className={
          error
            ? "mt-2 rounded-xl border border-destructive bg-secondary px-3 py-3 font-mono text-base text-card-foreground"
            : "mt-2 rounded-xl border border-border bg-secondary px-3 py-3 font-mono text-base text-card-foreground"
        }
      />
      {error ? (
        <Text className="mt-1 px-1 text-[13px] text-destructive">{error}</Text>
      ) : null}

      <View className="mt-4 flex-row gap-2">
        <SheetButton label="Cancel" variant="ghost" onPress={onClose} />
        <SheetButton label="Save" onPress={commit} />
      </View>
    </View>
  )
}
