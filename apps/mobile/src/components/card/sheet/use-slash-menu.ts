import {
  applyInsert,
  DEFAULT_SLASH_COMMANDS,
  filterSlashCommands,
  matchSlashTrigger,
  matchWikilinkTrigger,
  toWikilink,
  untriggeredInsert,
  type SlashCommand,
  type WikilinkOption,
} from "@doska/markdown"
import { rankBy } from "@doska/core/search"
import { useCallback, useMemo, useState } from "react"
import type { TextInputSelectionChangeEvent } from "react-native"

const NO_REFS: WikilinkOption[] = []

interface Options {
  value: string
  onChangeValue: (value: string) => void
  commands?: SlashCommand[]
  /** Cards the `[[` menu can link to; empty disables it. */
  cardRefs?: WikilinkOption[]
}

/**
 * The `/` command and `[[` wikilink menus for a React Native `TextInput`. The
 * web hooks drive a textarea through the DOM selection API; here the caret is
 * state we own, so the shared pieces are the trigger matchers, the command list
 * and the `$` caret sentinel.
 */
export function useSlashMenu({
  value,
  onChangeValue,
  commands = DEFAULT_SLASH_COMMANDS,
  cardRefs = NO_REFS,
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

  const moveCaret = useCallback((next: number) => {
    setCaret(next)
    setSelection({ start: next, end: next })
  }, [])

  const wikilink = useMemo(
    () => matchWikilinkTrigger(value, caret),
    [value, caret]
  )

  // A `[[` query may contain a `/`, and the link the author is halfway through
  // writing is the better guess at what they meant.
  const trigger = useMemo(
    () => (wikilink ? null : matchSlashTrigger(value, caret)),
    [value, caret, wikilink]
  )

  const items = useMemo(
    () =>
      trigger
        ? filterSlashCommands(commands, trigger.query, trigger.atLineStart)
        : [],
    [commands, trigger]
  )

  const refs = useMemo(() => {
    if (!wikilink) return NO_REFS
    return rankBy(cardRefs, wikilink.query, (option) => ({
      // `target` is the display id; the core matches on the number alone.
      number: option.target.slice(option.target.lastIndexOf("-") + 1),
      title: option.title,
    })).map((ranked) => ranked.item)
  }, [cardRefs, wikilink])

  const splice = useCallback(
    (from: number, to: number, text: string, caretOffset: number) => {
      onChangeValue(value.slice(0, from) + text + value.slice(to))
      moveCaret(from + caretOffset)
    },
    [onChangeValue, value, moveCaret]
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

  /** Replaces the typed `[[query` with a link to the chosen card. */
  const selectRef = useCallback(
    (option: WikilinkOption) => {
      if (!wikilink) return
      const text = toWikilink(option.target, option.title)
      splice(wikilink.start, caret, text, text.length)
    },
    [wikilink, caret, splice]
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
    /** Cards matching a typed `[[` trigger; empty when there is none. */
    refs,
    hasTrigger: trigger !== null,
    hasRefTrigger: wikilink !== null,
    select,
    selectRef,
    insertCommand,
    moveCaret,
    onSelectionChange,
    selection,
  }
}
