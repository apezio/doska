// import { Board } from "./board"
import { BottomBadges } from "./bottom-badges"
import { DocsPage } from "./docs/docs-page"
import { findDoc } from "./docs/pages"
import { Hero } from "./hero"
import { SiteFooter } from "./site-footer"
import { SiteHeader } from "./site-header"

export function App({ path }: { path: string }) {
  const doc = findDoc(path)

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">
        {doc ? (
          <DocsPage page={doc} />
        ) : (
          <>
            <Hero />
            <div className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
              <div>
                <h2 className="max-w-2xl text-3xl font-bold">In a folder</h2>
                <p className="mt-2 max-w-lg text-muted-foreground">
                  Select a folder to sync your board into. <br />
                  Folder per board and column, markdown file per card.
                </p>
              </div>
            </div>
            <div className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
              <div>
                <h2 className="max-w-2xl text-3xl font-bold">
                  On multiple devices
                </h2>
                <p className="mt-2 max-w-lg text-muted-foreground">
                  Self-host a sync server and sync boards across devices.
                </p>
              </div>
            </div>
            <div className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
              <div>
                <h2 className="max-w-2xl text-3xl font-bold">
                  Shared between multiple people
                </h2>
                <p className="mt-2 max-w-lg text-muted-foreground">
                  Create accounts and share with others, or make a public board.
                </p>
              </div>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
      {!doc && <BottomBadges />}
    </div>
  )
}
