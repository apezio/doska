import { ArrowLeft, ArrowRight } from "lucide-react"
import { docs, type DocPage } from "./pages"

/** Foot of a page: the neighbours in `docs`, which is reading order. */
export function DocsSteps({ current }: { current: DocPage }) {
  const at = docs.indexOf(current)
  const previous = docs[at - 1]
  const next = docs[at + 1]

  return (
    <nav className="mt-14 flex flex-wrap justify-between gap-4 border-t border-border pt-6 text-sm">
      {previous ? <Step page={previous} back /> : <span />}
      {next ? <Step page={next} /> : <span />}
    </nav>
  )
}

function Step({ page, back }: { page: DocPage; back?: boolean }) {
  return (
    <a
      href={page.path}
      className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
    >
      {back && <ArrowLeft className="size-4" />}
      <span>
        <span className="block text-xs">{back ? "Previous" : "Next"}</span>
        <span className="font-semibold text-foreground">{page.nav}</span>
      </span>
      {!back && <ArrowRight className="size-4" />}
    </a>
  )
}
