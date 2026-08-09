import { orpc } from "./sync/orpc"

/**
 * The board's public link. Owner-only server-side, and separate from
 * `members`: that shares with accounts on this deploy, this shares with anyone
 * holding the link, read-only and with no sign-in.
 *
 * The token is not on the dashboard record, so it is asked for rather than read
 * off the board the client already has.
 */

export async function publishBoard(boardId: string): Promise<string> {
  const { token } = await orpc.boards.publish({ boardId })
  return token
}

export function unpublishBoard(boardId: string): Promise<void> {
  return orpc.boards.unpublish({ boardId })
}

export async function publicBoardToken(
  boardId: string
): Promise<string | null> {
  const { token } = await orpc.boards.publicStatus({ boardId })
  return token
}
