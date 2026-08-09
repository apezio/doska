import { useQuery } from "@tanstack/react-query"
import { listAccounts } from "../api/accounts"
import { fetchSession } from "../api/auth"
import { listDirectory, listMembers, listSharedBoards } from "../api/members"
import {
  hasUnclaimedLocalBoards,
  UNCLAIMED_BOARDS_WARNING,
} from "../api/identity"
import * as api from "../api/operations"
import type { DigestFilter } from "../api/operations"
import { keys } from "./keys"

export type { Account } from "../api/accounts"
export { UNCLAIMED_BOARDS_WARNING }

/**
 * The sync session. `data` is `undefined` until the first check resolves; auth
 * only gates sync, so this never blocks the app — it just drives the sign-in UI.
 */
export function useSession() {
  return useQuery({ queryKey: keys.session, queryFn: fetchSession })
}

/** Whether the sign-in form should warn that the boards on this device are
 * about to become part of whichever account signs in*/
export function useUnclaimedLocalBoards() {
  return useQuery({
    queryKey: keys.unclaimedLocalBoards,
    queryFn: hasUnclaimedLocalBoards,
    networkMode: "always",
  })
}

/** Every account on the server. Admin-only server-side, so `enabled` is how the
 * caller keeps a non-admin session from firing a request that would 403. */
export function useAccounts(enabled: boolean) {
  return useQuery({
    queryKey: keys.accounts,
    queryFn: listAccounts,
    enabled,
  })
}

/** Who a board is shared with, and what the reader may change about it.
 * Board-scoped server-side, so `enabled` keeps a signed-out session quiet. */
export function useBoardMembers(boardId: string, enabled: boolean) {
  return useQuery({
    queryKey: keys.members(boardId),
    queryFn: () => listMembers(boardId),
    enabled,
  })
}

/** Which boards are shared, for the sidebar's marker. */
export function useSharedBoards(enabled: boolean) {
  return useQuery({
    queryKey: keys.sharedBoards,
    queryFn: listSharedBoards,
    enabled,
  })
}

/** Every active account, for the member picker. Any session may read it. */
export function useDirectory(enabled: boolean) {
  return useQuery({
    queryKey: keys.directory,
    queryFn: listDirectory,
    enabled,
  })
}

// These read IndexedDB, so they must resolve offline (see query-client.ts).
export function useDashboards() {
  return useQuery({
    queryKey: keys.dashboards,
    queryFn: () => api.getDashboards(),
    networkMode: "always",
  })
}

export function useBoard(deckId: string) {
  return useQuery({
    queryKey: keys.board(deckId),
    queryFn: () => api.getBoard(deckId),
    networkMode: "always",
  })
}

/** Everything deleted and still restorable — see {@link api.getTrash}. */
export function useTrash() {
  return useQuery({
    queryKey: keys.trash,
    queryFn: () => api.getTrash(),
    networkMode: "always",
  })
}

/** Deadlined cards across every board, for the digest. */
export function useDigest(filter: DigestFilter) {
  return useQuery({
    queryKey: keys.digestFilter(filter),
    queryFn: () => api.getDigest(filter),
    networkMode: "always",
  })
}

/** The board an arbitrary card belongs to — see {@link api.getCardDeck}. */
export function useCardDeck(id: string | null) {
  return useQuery({
    queryKey: keys.cardDeck(id ?? ""),
    queryFn: () => api.getCardDeck(id as string),
    enabled: id != null,
    networkMode: "always",
  })
}

/** The column an arbitrary card lives in — see {@link api.getCardCol}. */
export function useCardCol(id: string | null) {
  return useQuery({
    queryKey: keys.cardCol(id ?? ""),
    queryFn: () => api.getCardCol(id as string),
    enabled: id != null,
    networkMode: "always",
  })
}

export function useCard(id: string | null) {
  return useQuery({
    queryKey: keys.card(id ?? ""),
    queryFn: () => api.getCard(id as string),
    enabled: id != null,
    networkMode: "always",
  })
}
