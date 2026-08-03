import type { Card } from "@doska/core/types"
import { generateKeyBetween } from "fractional-indexing"

/**
 * The key for a card dropped between `before` and `after`, or null if there is
 * no room for one. `generateKeyBetween` throws when the two neighbours carry
 * the same position, which should not happen and yet does — and because the
 * drop handler is async, the throw surfaces only as an unhandled rejection
 * reading `Error:  >= `. Named here instead, with the cards that collided.
 */
export function keyBetween(before?: Card, after?: Card): string | null {
  try {
    return generateKeyBetween(before?.position ?? null, after?.position ?? null)
  } catch {
    console.warn(
      `[board] no key between ${before?.id}@${before?.position} and ${after?.id}@${after?.position} — drop ignored`
    )
    return null
  }
}
