import { Board } from "./board"
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
            <Board />
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
