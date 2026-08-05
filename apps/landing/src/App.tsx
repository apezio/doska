import { Board } from "./board"
import { Hero } from "./hero"
import { SiteFooter } from "./site-footer"
import { SiteHeader } from "./site-header"

export function App() {
  return (
    <div className="min-h-svh">
      <SiteHeader />
      <main>
        <Hero />
        <Board />
      </main>
      <SiteFooter />
    </div>
  )
}
