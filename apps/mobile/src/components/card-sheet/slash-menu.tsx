import type { SlashCommand } from "@doska/markdown/core"
import { Pressable, ScrollView, Text, View } from "react-native"

interface IProps {
  items: SlashCommand[]
  /** Whether the full command list is being shown without a typed trigger. */
  isOpen: boolean
  onToggle: () => void
  onSelect: (command: SlashCommand) => void
}

/**
 * The slash command bar, sitting directly above the keyboard as a horizontal
 * strip rather than the web's caret-anchored dropdown — there is no room for a
 * popover on a phone, and the keyboard pins the only free edge.
 *
 * The `/` button is the mobile equivalent of the web's floating action button:
 * typing `/` on a phone keyboard means switching layouts, so the commands have
 * to be reachable without it.
 */
export function SlashMenu({ items, isOpen, onToggle, onSelect }: IProps) {
  return (
    <View className="flex-row items-center border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <Pressable
        onPress={onToggle}
        className={
          isOpen
            ? "m-2 h-9 w-9 items-center justify-center rounded-lg bg-blue-600"
            : "m-2 h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800"
        }
      >
        <Text
          className={
            isOpen
              ? "text-lg font-semibold text-white"
              : "text-lg font-semibold text-neutral-600 dark:text-neutral-300"
          }
        >
          /
        </Text>
      </Pressable>

      <ScrollView
        horizontal
        keyboardShouldPersistTaps="always"
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="items-center gap-2 pr-3"
      >
        {items.map((command) => (
          <Pressable
            key={command.id}
            onPress={() => onSelect(command)}
            className="rounded-lg bg-neutral-100 px-3 py-1.5 active:bg-neutral-200 dark:bg-neutral-800 dark:active:bg-neutral-700"
          >
            <Text className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
              {command.title}
            </Text>
            {command.hint ? (
              <Text className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {command.hint}
              </Text>
            ) : null}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}
