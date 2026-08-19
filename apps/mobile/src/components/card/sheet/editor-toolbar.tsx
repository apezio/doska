import type { SlashCommand, WikilinkOption } from "@doska/markdown"
import { Frosted, Text } from "@doska/ui-kit-mobile"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import type { LucideIcon } from "lucide-react-native"
import Code from "lucide-react-native/icons/code"
import Eye from "lucide-react-native/icons/eye"
import Heading1 from "lucide-react-native/icons/heading-1"
import Heading2 from "lucide-react-native/icons/heading-2"
import Heading3 from "lucide-react-native/icons/heading-3"
import Image from "lucide-react-native/icons/image"
import Link from "lucide-react-native/icons/link"
import ListChecks from "lucide-react-native/icons/list-checks"
import Minus from "lucide-react-native/icons/minus"
import Paperclip from "lucide-react-native/icons/paperclip"
import Scissors from "lucide-react-native/icons/scissors"
import TextQuote from "lucide-react-native/icons/text-quote"
import type { ReactNode } from "react"
import { Pressable, ScrollView, View } from "react-native"

const ICON: Record<string, LucideIcon> = {
  todo: ListChecks,
  h1: Heading1,
  h2: Heading2,
  h3: Heading3,
  quote: TextQuote,
  code: Code,
  divider: Minus,
  cut: Scissors,
  link: Link,
}

const PILL_HEIGHT = 48
const ROW_PADDING = 8

/** What the bar covers, for the scroller it floats over to keep clear. */
export const TOOLBAR_HEIGHT = PILL_HEIGHT + ROW_PADDING * 2

// Notes' bar reads as a card floating over the note, which the shadow carries —
// the border is for dark mode, where the shadow disappears into the background.
const SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.12,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
}

interface IProps {
  /** Commands to offer: the matches for a typed `/`, or the full list. */
  items: SlashCommand[]
  /** Cards matching a typed `[[`; these take the pill over the commands. */
  refs: WikilinkOption[]
  isPreview: boolean
  /** False when there is no backend or no session to upload to. */
  canAttach: boolean
  /** True while an upload is in flight; the rows carry the progress. */
  attaching: boolean
  onAttach: () => void
  onAttachPhoto: () => void
  onTogglePreview: () => void
  onSelect: (command: SlashCommand) => void
  onSelectRef: (option: WikilinkOption) => void
}

/**
 * The editor's one toolbar, as two pills: the commands on the left, attaching
 * and the preview toggle on the right. The photo library needs its own button:
 * the document picker cannot see it. The left pill is dropped entirely rather
 * than shown empty — in preview, and when a typed trigger matches nothing.
 */
export function EditorToolbar({
  items,
  refs,
  isPreview,
  canAttach,
  attaching,
  onAttach,
  onAttachPhoto,
  onTogglePreview,
  onSelect,
  onSelectRef,
}: IProps) {
  const tokens = useTokens()

  return (
    <View
      className="flex-row items-center justify-center gap-2 px-3"
      style={{ paddingVertical: ROW_PADDING }}
    >
      {refs.length ? (
        <Pill grow>
          <Rail>
            {refs.map((option) => (
              <Pressable
                key={option.id}
                onPress={() => onSelectRef(option)}
                accessibilityRole="button"
                accessibilityLabel={`${option.target} ${option.title}`}
                className="h-10 max-w-56 flex-row items-center gap-1.5 rounded-full px-3 active:bg-secondary"
              >
                <Text className="font-mono text-[13px] text-primary">
                  {option.target}
                </Text>
                <Text
                  numberOfLines={1}
                  className="shrink text-[14px] text-card-foreground"
                >
                  {option.title}
                </Text>
              </Pressable>
            ))}
          </Rail>
        </Pill>
      ) : items.length ? (
        <Pill grow>
          <Rail>
            {items.map((command) => {
              const Glyph = ICON[command.id]
              return (
                <ToolButton
                  key={command.id}
                  label={command.title}
                  onPress={() => onSelect(command)}
                >
                  {Glyph ? (
                    <Glyph size={22} color={tokens.cardForeground} />
                  ) : (
                    <Text className="text-[13px] font-sans-medium text-card-foreground">
                      {command.title}
                    </Text>
                  )}
                </ToolButton>
              )
            })}
          </Rail>
        </Pill>
      ) : null}

      <Pill>
        <ToolButton
          label="Attach photo"
          disabled={!canAttach || attaching}
          onPress={onAttachPhoto}
        >
          <Image size={22} color={tokens.cardForeground} />
        </ToolButton>
        <ToolButton
          label="Attach file"
          disabled={!canAttach || attaching}
          onPress={onAttach}
        >
          <Paperclip size={22} color={tokens.cardForeground} />
        </ToolButton>
        <ToolButton
          label="Preview"
          active={isPreview}
          onPress={onTogglePreview}
        >
          <Eye
            size={22}
            color={isPreview ? tokens.primary : tokens.cardForeground}
          />
        </ToolButton>
      </Pill>
    </View>
  )
}

/** The horizontal strip of choices inside the left pill. */
function Rail({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      // A tap here must not be spent dismissing the keyboard.
      keyboardShouldPersistTaps="always"
      showsHorizontalScrollIndicator={false}
      className="flex-1"
      contentContainerClassName="items-center gap-1 px-1"
    >
      {children}
    </ScrollView>
  )
}

/** One frosted capsule. `grow` gives it the row's spare width. */
function Pill({ grow, children }: { grow?: boolean; children: ReactNode }) {
  const tokens = useTokens()

  return (
    <View style={grow ? { ...SHADOW, flex: 1 } : SHADOW}>
      <Frosted
        style={{
          height: PILL_HEIGHT,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 6,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: tokens.border,
          backgroundColor: tokens.cardVeil,
          // Without this the blur ignores the radius and fills the corners.
          overflow: "hidden",
        }}
      >
        {children}
      </Frosted>
    </View>
  )
}

function ToolButton({
  label,
  active,
  disabled,
  onPress,
  children,
}: {
  label: string
  active?: boolean
  disabled?: boolean
  onPress: () => void
  children: ReactNode
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active, disabled }}
      style={disabled ? { opacity: 0.3 } : undefined}
      className={
        active
          ? "size-10 items-center justify-center rounded-full bg-secondary"
          : "size-10 items-center justify-center rounded-full active:bg-secondary"
      }
    >
      {children}
    </Pressable>
  )
}
