import type { SlashCommand } from "@doska/markdown/core"
import {
  Code,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  Link,
  ListChecks,
  Minus,
  Scissors,
  TextQuote,
  type LucideIcon,
} from "lucide-react-native"
import { BlurView } from "expo-blur"
import type { ReactNode } from "react"
import { Pressable, ScrollView, Text, View } from "react-native"
import { useTokens } from "@/lib/tokens"

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
  isPreview: boolean
  onTogglePreview: () => void
  onSelect: (command: SlashCommand) => void
}

/**
 * The editor's one toolbar, as two pills: the commands on the left, the preview
 * toggle on its own to the right. The command pill is dropped entirely rather
 * than shown empty — in preview, and when a typed `/` matches nothing.
 */
export function EditorToolbar({
  items,
  isPreview,
  onTogglePreview,
  onSelect,
}: IProps) {
  const tokens = useTokens()

  return (
    <View
      className="flex-row items-center justify-center gap-2 px-3"
      style={{ paddingVertical: ROW_PADDING }}
    >
      {items.length ? (
        <Pill grow>
          <ScrollView
            horizontal
            // A tap here must not be spent dismissing the keyboard.
            keyboardShouldPersistTaps="always"
            showsHorizontalScrollIndicator={false}
            className="flex-1"
            contentContainerClassName="items-center gap-1 px-1"
          >
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
          </ScrollView>
        </Pill>
      ) : null}

      <Pill>
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

/** One frosted capsule. `grow` gives it the row's spare width. */
function Pill({ grow, children }: { grow?: boolean; children: ReactNode }) {
  const tokens = useTokens()

  return (
    <View style={grow ? { ...SHADOW, flex: 1 } : SHADOW}>
      <BlurView
        intensity={20}
        tint={tokens.dark ? "dark" : "light"}
        // Styled by value, not by class: NativeWind only rewrites `className`
        // on React Native's own components, and BlurView is not one.
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
      </BlurView>
    </View>
  )
}

function ToolButton({
  label,
  active,
  onPress,
  children,
}: {
  label: string
  active?: boolean
  onPress: () => void
  children: ReactNode
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
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
