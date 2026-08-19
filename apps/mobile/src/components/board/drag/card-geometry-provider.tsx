import { useCallback, useMemo, useRef, type ReactNode } from "react"
import type { View } from "react-native"
import { CARD_GAP, CardGeometryContext } from "./card-geometry"

interface ColumnGeometry {
  list: View | null
  heights: Record<string, number>
  top: number | null
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
    columns.current[columnId] ??= { list: null, heights: {}, top: null }
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

  // Walking the stacked heights is the same in both directions, so the async
  // and cached paths share it rather than drifting apart.
  const indexFrom = useCallback(
    (columnId: string, order: string[], y: number, top: number) => {
      const { heights } = columnOf(columnId)
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

  const cacheColumnTop = useCallback((columnId: string) => {
    const column = columnOf(columnId)
    column.list?.measureInWindow((_x, pageY) => {
      column.top = pageY
    })
  }, [])

  const forgetColumnTops = useCallback(() => {
    for (const column of Object.values(columns.current)) column.top = null
  }, [])

  const dropIndexAt = useCallback(
    (columnId: string, order: string[], y: number) => {
      const { top } = columnOf(columnId)
      if (top === null) return null
      return indexFrom(columnId, order, y, top)
    },
    [indexFrom]
  )

  const resolveDropIndex = useCallback(
    async (columnId: string, order: string[], y: number) => {
      const { list } = columnOf(columnId)
      if (!list) return order.length

      const top = await new Promise<number | null>((settle) => {
        list.measureInWindow((_x, pageY) => settle(pageY))
      })
      if (top === null) return order.length

      return indexFrom(columnId, order, y, top)
    },
    [indexFrom]
  )

  // Memoised: every card reads it, and they are memoised on their props.
  const value = useMemo(
    () => ({
      registerList,
      registerHeight,
      heightOf,
      resolveDropIndex,
      cacheColumnTop,
      forgetColumnTops,
      dropIndexAt,
    }),
    [
      registerList,
      registerHeight,
      heightOf,
      resolveDropIndex,
      cacheColumnTop,
      forgetColumnTops,
      dropIndexAt,
    ]
  )

  return (
    <CardGeometryContext.Provider value={value}>
      {children}
    </CardGeometryContext.Provider>
  )
}
