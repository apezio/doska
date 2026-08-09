import type { DigestFilter } from "../api/operations"

export const keys = {
  dashboards: ["dashboards"] as const,
  /** The bare key is the invalidation prefix for every board. */
  boards: ["board"] as const,
  board: (deckId: string) => ["board", deckId] as const,
  /** The bare key is the invalidation prefix for every card. */
  cards: ["card"] as const,
  card: (id: string) => ["card", id] as const,
  trash: ["trash"] as const,
  /** The bare key is the invalidation prefix for every filter's digest. */
  digest: ["digest"] as const,
  digestFilter: (filter: DigestFilter) => ["digest", filter] as const,
  cardDeck: (id: string) => ["card-deck", id] as const,
  cardCol: (id: string) => ["card-col", id] as const,
  session: ["session"] as const,
  accounts: ["accounts"] as const,
  /** Under the accounts prefix, so deleting an account clears its own count. */
  ownedBoards: (userId: string) => ["accounts", "owned-boards", userId] as const,
  members: (boardId: string) => ["members", boardId] as const,
  sharedBoards: ["dashboards", "shared"] as const,
  directory: ["directory"] as const,
  unclaimedLocalBoards: ["unclaimed-local-boards"] as const,
}

/**
 * What a write to one card's content goes stale in
 */
export const cardWriteKeys = (id: string) =>
  [keys.card(id), keys.digest, keys.boards] as const
