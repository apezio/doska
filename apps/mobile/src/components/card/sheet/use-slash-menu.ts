import {
  applyInsert,
  DEFAULT_SLASH_COMMANDS,
  filterSlashCommands,
  matchSlashTrigger,
  untriggeredInsert,
  type SlashCommand,
} from "@doska/markdown"
import { useCallback, useMemo, useState } from "react"
import type { TextInputSelectionChangeEvent } from "react-native"

interface Options {
  value: string
  onChangeValue: (value: string) => void
  commands?: SlashCommand[]
}

/**
 * The `/` slash command menu for a React Native `TextInput`. The web hook drives
 * a textarea through the DOM selection API; here the caret is state we own, so
 * the shared pieces are the command list, the filter and the `$` caret sentinel.
 */
export function useSlashMenu({
  value,
  onChangeValue,
  commands = DEFAULT_SLASH_COMMANDS,
}: Options) {
  const [caret, setCaret] = useState(0)
  // Set only when an insert has to move the caret; `TextInput` owns it otherwise.
  const [selection, setSelection] = useState<
    { start: number; end: number } | undefined
  >(undefined)

  const onSelectionChange = useCallback((e: TextInputSelectionChangeEvent) => {
    setCaret(e.nativeEvent.selection.start)
    // Once the input reports the caret we asked for, hand control back.
    setSelection(undefined)
  }, [])

  const trigger = useMemo(
    () => matchSlashTrigger(value, caret),
    [value, caret]
  )

  const items = useMemo(
    () =>
      trigger
        ? filterSlashCommands(commands, trigger.query, trigger.atLineStart)
        : [],
    [commands, trigger]
  )

  const splice = useCallback(
    (from: number, to: number, text: string, caretOffset: number) => {
      onChangeValue(value.slice(0, from) + text + value.slice(to))
      const next = from + caretOffset
      setCaret(next)
      setSelection({ start: next, end: next })
    },
    [onChangeValue, value]
  )

  /** Replaces the typed `/query` with the chosen command. */
  const select = useCallback(
    (command: SlashCommand) => {
      if (!trigger) return
      const { text, caretOffset } = applyInsert(command.insert)
      splice(trigger.start, caret, text, caretOffset)
    },
    [trigger, caret, splice]
  )

  /** Inserts a command at the caret with no typed trigger, for the toolbar. */
  const insertCommand = useCallback(
    (command: SlashCommand) => {
      const { text, caretOffset } = untriggeredInsert(command, value, caret)
      splice(caret, caret, text, caretOffset)
    },
    [caret, value, splice]
  )

  return {
    commands,
    caret,
    /** Commands matching a typed `/` trigger; empty when there is none. */
    items,
    hasTrigger: trigger !== null,
    select,
    insertCommand,
    onSelectionChange,
    selection,
  }
}
