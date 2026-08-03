import { useCallback, useRef, type ReactNode } from "react"
import type { View } from "react-native"
import { CARD_GAP, CardGeometryContext } from "./card-geometry"

interface ColumnGeometry {
  list: View | null
  heights: Record<string, number>
}

/**
 * Places a card dropped into a column it does not belong to — the one case the
 * sortable cannot work out itself.
 *
 * Heights, not positions: a sortable lays its cards out by transform, so their
 * `onLayout` says nothing about where they sit. The drop target is never the
 * column being dragged in, so its cards are in plain order and stacking heights
 * from the list's top gives their real positions.
 */
export function CardGeometryProvider({ children }: { children: ReactNode }) {
  const columns = useRef<Record<string, ColumnGeometry>>({})

  function columnOf(columnId: string) {
    columns.current[columnId] ??= { list: null, heights: {} }
    return columns.current[columnId]
  }

  const registerList = useCallback((columnId: string, list: View | null) => {
    columnOf(columnId).list = list
  }, [])

  const registerHeight = useCallback(
    (columnId: string, cardId: string, height: number) => {
      columnOf(columnId).heights[cardId] = height
    },
    []
  )

  const heightOf = useCallback(
    (columnId: string, cardId: string) =>
      columnOf(columnId).heights[cardId] ?? 0,
    []
  )

  const resolveDropIndex = useCallback(
    async (columnId: string, order: string[], y: number) => {
      const { list, heights } = columnOf(columnId)
      if (!list) return order.length

      const top = await new Promise<number | null>((settle) => {
        list.measureInWindow((_x, pageY) => settle(pageY))
      })
      if (top === null) return order.length

      let index = 0
      let cursor = top
      for (const cardId of order) {
        const height = heights[cardId]
        if (height === undefined) break
        if (y <= cursor + height / 2) break
        cursor += height + CARD_GAP
        index++
      }
      return index
    },
    []
  )

  return (
    <CardGeometryContext.Provider
      value={{ registerList, registerHeight, heightOf, resolveDropIndex }}
    >
      {children}
    </CardGeometryContext.Provider>
  )
}
