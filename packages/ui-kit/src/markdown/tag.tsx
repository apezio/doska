import type { CSSProperties, ReactNode } from "react"
import { tagHue } from "@doska/tokens/tags"

/**
 * `[content]` rendered as a colored pill
 */
export function MdTag({
  color,
  children,
}: {
  color: number
  children: ReactNode
}) {
  const { hue, light, dark } = tagHue(color)
  return (
    <span
      className="tag inline-block rounded-full bg-[var(--tag-bg)] px-[0.5em] py-[0.05em] align-baseline text-[0.8125em] leading-[1.4] font-medium whitespace-nowrap text-[var(--tag-fg)] not-italic dark:bg-[var(--tag-bg-dark)] dark:text-[var(--tag-fg-dark)]"
      data-tag-color={color}
      style={
        {
          "--tag-bg": `oklch(0.95 0.05 ${hue})`,
          "--tag-fg": `oklch(${light} 0.14 ${hue})`,
          "--tag-bg-dark": `oklch(0.62 0.14 ${hue} / 0.24)`,
          "--tag-fg-dark": `oklch(${dark} 0.11 ${hue})`,
        } as CSSProperties
      }
    >
      {children}
    </span>
  )
}
