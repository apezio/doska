import { tokenStyles, tokenizeMarkdown } from "@doska/highlight"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import { useMemo } from "react"
import { Text } from "react-native"
import { tokenTextStyles } from "./theme"

interface IProps {
  value: string
  /** Wikilink targets that resolve; without them every reference reads as live. */
  targets?: string[]
  /**
   * The input's own type and box classes, so both lay the text out identically.
   * Anything that moves a glyph — font, size, line height, padding — belongs
   * here rather than on one of the two layers alone.
   */
  className?: string
}

/**
 * Paints the editor's text a second time, behind it, with the syntax styled.
 * The `TextInput` on top keeps the caret and the selection and draws its own
 * text transparent.
 */
export function HighlightOverlay({ value, targets, className }: IProps) {
  const tokens = useTokens()
  const theme = useMemo(() => tokenTextStyles(tokens), [tokens])
  const lines = useMemo(
    () => tokenizeMarkdown(value, { targets }),
    [value, targets]
  )

  return (
    <Text
      accessible={false}
      style={{ pointerEvents: "none" }}
      className={className}
    >
      {lines.map((line, index) => (
        <Text key={index}>
          {index > 0 ? "\n" : null}
          {line.map((token, run) => (
            <Text key={run} style={tokenStyles(token, theme)}>
              {token.text}
            </Text>
          ))}
        </Text>
      ))}
    </Text>
  )
}
