import { useState } from "react"
import { View, type TextInputProps } from "react-native"
import { Input } from "./input"
import { SheetBar, SheetFootnote, SheetScreen } from "./sheet"

/** Either the value to commit, or why the draft cannot be committed. */
export type NameCheck = { value: string } | { error: string }

interface IProps {
  /** The sheet bar's title, e.g. "Rename board". */
  title: string
  /** What the thing is called now. */
  value: string
  /** Names the field to a screen reader. */
  label: string
  placeholder?: string
  /** The line below the field, which follows the draft as it is typed. */
  footnote?: (draft: string) => string
  /** Rewrites every keystroke, e.g. upper-casing a prefix. */
  normalize?: (raw: string) => string
  /** Vets the draft. Trimmed as typed when left out. */
  validate?: (draft: string) => NameCheck
  mono?: boolean
  maxLength?: number
  autoCapitalize?: TextInputProps["autoCapitalize"]
  onCommit: (value: string) => void
  onClose: () => void
}

/**
 * The sheet for renaming one thing: a bar, a single field, and a footnote. The
 * mobile headers are too cramped to edit a title in place, so every name in the
 * app is changed through this.
 *
 * Committing an unchanged or empty name is not an error — it just closes.
 */
export function RenameOneSheet({
  title,
  value,
  label,
  placeholder,
  footnote,
  normalize,
  validate,
  mono,
  maxLength,
  autoCapitalize = "sentences",
  onCommit,
  onClose,
}: IProps) {
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState<string | null>(null)

  const note = error ?? footnote?.(draft)

  function commit() {
    const checked: NameCheck = validate
      ? validate(draft)
      : { value: draft.trim() }

    if ("error" in checked) {
      setError(checked.error)
      return
    }
    if (checked.value && checked.value !== value) onCommit(checked.value)
    onClose()
  }

  return (
    <SheetScreen>
      <View>
        <SheetBar
          title={title}
          leading={{ label: "Cancel", onPress: onClose }}
          trailing={{ label: "Save", onPress: commit }}
        />
        <Input
          tone="secondary"
          className="mt-2"
          mono={mono}
          invalid={Boolean(error)}
          value={draft}
          autoFocus
          selectTextOnFocus
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          maxLength={maxLength}
          placeholder={placeholder}
          accessibilityLabel={label}
          returnKeyType="done"
          onChangeText={(next) => {
            setDraft(normalize ? normalize(next) : next)
            setError(null)
          }}
          onSubmitEditing={commit}
        />
        {note ? <SheetFootnote error={error !== null} text={note} /> : null}
      </View>
    </SheetScreen>
  )
}
