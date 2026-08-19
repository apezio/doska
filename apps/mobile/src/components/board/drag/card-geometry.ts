import { createContext, useContext } from "react"
import type { View } from "react-native"

/** The gap between cards, needed to place a card the list has not laid out yet. */
export const CARD_GAP = 12

export interface CardGeometry {
  registerList: (columnId: string, list: View | null) => void
  registerHeight: (columnId: string, cardId: string, height: number) => void
  heightOf: (columnId: string, cardId: string) => number
  /**
   * The index a card released at window `y` would take in `order` — the
   * ordering of `columnId` with the dragged card already left out.
   */
  resolveDropIndex: (
    columnId: string,
    order: string[],
    y: number
  ) => Promise<number>
  /** Caches a column's top so `dropIndexAt` can run without measuring. */
  cacheColumnTop: (columnId: string) => void
  /** Clears every cached top, so a scroll cannot leave a stale one behind. */
  forgetColumnTops: () => void
  /**
   * `resolveDropIndex` against the cached top, cheap enough to call while the
   * finger moves. Null until `cacheColumnTop` has landed for that column.
   */
  dropIndexAt: (columnId: string, order: string[], y: number) => number | null
}

export const CardGeometryContext = createContext<CardGeometry | null>(null)

export function useCardGeometry() {
  const value = useContext(CardGeometryContext)
  if (!value)
    throw new Error(
      "useCardGeometry must be used inside a CardGeometryProvider"
    )
  return value
}
