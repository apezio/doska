import { Loader2 } from "lucide-react"
import { usePublicBoard } from "@doska/core/queries"
import { PublicBoardNotFound } from "@doska/core/public"
import { PublicBoard } from "./public-board"
import { PublicCardPanel } from "./public-card-panel"

interface IProps {
  token: string
  /** The board's own path, which the card panel closes back to. */
  closeHref: string
}

/**
 * A published board. One fetch, no session and no local database: nothing here
 * is written down, so a visitor leaves with an empty browser.
 */
export function PublicBoardPage({ token, closeHref }: IProps) {
  const { data: snapshot, isPending, error } = usePublicBoard(token)

  if (isPending)
    return (
      <div className="flex h-(--app-height,100svh) items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )

  if (error || !snapshot)
    return (
      <div className="flex h-(--app-height,100svh) items-center justify-center px-6">
        <p className="max-w-sm text-center text-muted-foreground">
          {error instanceof PublicBoardNotFound
            ? "This board is not shared, or the link has been turned off."
            : "Could not load this board. Try again in a moment."}
        </p>
      </div>
    )

  return (
    <div className="flex h-(--app-height,100svh) w-full overflow-hidden">
      <main className="relative flex w-full min-w-0 flex-1 flex-col overflow-hidden">
        <PublicBoard token={token} snapshot={snapshot} />
      </main>
      <PublicCardPanel
        token={token}
        snapshot={snapshot}
        closeHref={closeHref}
      />
    </div>
  )
}
