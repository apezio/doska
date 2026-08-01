import {
  applyInsert,
  DEFAULT_SLASH_COMMANDS,
  filterSlashCommands,
  type SlashCommand,
} from "@doska/markdown/core"
import { useCallback, useMemo, useState } from "react"
import type {
  TextInputSelectionChangeEventData,
  NativeSyntheticEvent,
} from "react-native"

// A `/` at the start of input or right after whitespace, followed by the query
// (any non-whitespace run) up to the caret. Same trigger the web menu uses.
const TRIGGER_RE = /(?:^|\s)\/(\S*)$/

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

  const onSelectionChange = useCallback(
    (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      setCaret(e.nativeEvent.selection.start)
      // Once the input reports the caret we asked for, hand control back.
      setSelection(undefined)
    },
    []
  )

  const trigger = useMemo(() => {
    const before = value.slice(0, caret)
    const match = TRIGGER_RE.exec(before)
    if (!match) return null
    const start = caret - match[1].length - 1
    return {
      start,
      query: match[1],
      atLineStart: start === 0 || value[start - 1] === "\n",
    }
  }, [value, caret])

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

  /**
   * Inserts a command at the caret with no typed trigger, for the toolbar.
   * Block commands are pushed onto a fresh line when the caret sits mid-line,
   * so the markdown stays valid.
   */
  const insertCommand = useCallback(
    (command: SlashCommand) => {
      const atLineStart = caret === 0 || value[caret - 1] === "\n"
      const prefix =
        (command.scope ?? "block") === "block" && !atLineStart ? "\n" : ""
      const { text, caretOffset } = applyInsert(command.insert)
      splice(caret, caret, prefix + text, prefix.length + caretOffset)
    },
    [caret, value, splice]
  )

  return {
    commands,
    /** Commands matching a typed `/` trigger; empty when there is none. */
    items,
    hasTrigger: trigger !== null,
    select,
    insertCommand,
    onSelectionChange,
    selection,
  }
}
