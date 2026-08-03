import { useCallback } from "react"
import { useTriggerMenu } from "../menu"
import {
  applyInsert,
  DEFAULT_SLASH_COMMANDS,
  filterSlashCommands,
  SLASH_TRIGGER,
  untriggeredInsert,
  type SlashCommand,
} from "@doska/markdown"

interface Options {
  value: string
  onChangeValue: (value: string) => void
  commands?: SlashCommand[]
  enabled?: boolean
}

/**
 * The `/` slash command menu: filters commands as you type and inserts the
 * chosen snippet at the caret.
 */
export function useSlashMenu(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  {
    value,
    onChangeValue,
    commands = DEFAULT_SLASH_COMMANDS,
    enabled = true,
  }: Options
) {
  const getItems = useCallback(
    (query: string, { atLineStart }: { atLineStart: boolean }) =>
      filterSlashCommands(commands, query, atLineStart),
    [commands]
  )

  const toInsert = useCallback(
    (command: SlashCommand) => applyInsert(command.insert),
    []
  )

  const { menu, activeIndex, select, setActiveIndex, spliceAt } =
    useTriggerMenu(ref, {
      value,
      onChangeValue,
      enabled,
      trigger: SLASH_TRIGGER,
      triggerLength: 1,
      getItems,
      toInsert,
    })

  /** Inserts a command at the current caret, without a typed `/` trigger (used
   * by the mobile floating menu). */
  const insertCommand = useCallback(
    (command: SlashCommand) => {
      const textarea = ref.current
      if (!textarea) return
      textarea.focus()
      const start = textarea.selectionStart
      spliceAt(
        start,
        textarea.selectionEnd,
        untriggeredInsert(command, textarea.value, start)
      )
    },
    [ref, spliceAt]
  )

  return { menu, activeIndex, select, setActiveIndex, insertCommand }
}
