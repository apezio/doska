import { keys } from "@doska/core/keys"
import {
  createCard,
  deleteCard,
  getBoard,
  moveCardToColumn,
  restore,
  updateCard,
} from "@doska/core/operations"
import { Vault, type VaultBoard } from "@doska/vault"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"
import { isDesktop } from "../platform"
import { tauriFs } from "./tauri-fs"

const pathKey = (boardId: string) => `deck:vault:${boardId}`

function message(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause)
}

function boardOps(boardId: string): VaultBoard {
  return {
    load: () => getBoard(boardId),
    createCard,
    updateCard,
    moveCardToColumn,
    deleteCard: (id) => deleteCard(boardId, id),
    restoreCard: (id) => restore("cards", id),
  }
}

/**
 * Mirrors a board to a folder the user picks: one folder per column, one
 * Markdown file per card, edits flowing both ways.
 *
 * The folder is remembered per board and remounted on load, which works across
 * launches because the desktop app restores dialog-granted fs scopes.
 */
export function useVault(boardId: string) {
  const qc = useQueryClient()
  const [path, setPath] = useState<string | null>(() =>
    isDesktop() ? localStorage.getItem(pathKey(boardId)) : null
  )
  const [error, setError] = useState<string | null>(null)
  const stop = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!path) return

    let live = true
    const vault = new Vault({
      fs: tauriFs,
      board: boardOps(boardId),
      root: path,
      onError: (cause) => setError(message(cause)),
      onBoardChange: () => {
        qc.invalidateQueries({ queryKey: keys.boards })
        qc.invalidateQueries({ queryKey: keys.cards })
        qc.invalidateQueries({ queryKey: keys.cardCols })
        qc.invalidateQueries({ queryKey: keys.digest })
        qc.invalidateQueries({ queryKey: keys.trash })
      },
    })

    // The watcher only reports the folder. Board edits reach the vault through
    // the cache instead, or a card created in the app would sit there until
    // something happened on disk.
    const off = qc.getQueryCache().subscribe((event) => {
      if (event.type !== "updated" || event.action.type !== "success") return
      if (event.query.queryKey[0] !== keys.boards[0]) return
      vault.sync().catch((cause: unknown) => setError(message(cause)))
    })

    void vault
      .watch()
      .then((unwatch) => {
        if (live) stop.current = unwatch
        else unwatch()
      })
      // A remembered folder can stop being readable between launches: it was
      // moved, or the scope grant behind it was lost. Either way, unmount.
      .catch((cause: unknown) => {
        if (!live) return
        setError(message(cause))
        localStorage.removeItem(pathKey(boardId))
        setPath(null)
      })

    return () => {
      live = false
      off()
      stop.current?.()
      stop.current = null
    }
  }, [boardId, path, qc])

  const mount = useCallback(async () => {
    const { open } = await import("@tauri-apps/plugin-dialog")
    // `recursive` is what widens the granted fs scope from `folder/*` to
    // `folder/**`. Without it every card file, one level down, is out of scope.
    const picked = await open({ directory: true, recursive: true })
    if (typeof picked !== "string") return

    setError(null)
    localStorage.setItem(pathKey(boardId), picked)
    setPath(picked)
  }, [boardId])

  const unmount = useCallback(() => {
    localStorage.removeItem(pathKey(boardId))
    setPath(null)
  }, [boardId])

  return { available: isDesktop(), path, error, mount, unmount }
}
