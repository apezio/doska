import { renderToString } from "react-dom/server"
import { App } from "./App"
import { docs } from "./docs/pages"

export { app, releases, repo } from "./links"

export function render(path: string) {
  return renderToString(<App path={path} />)
}

export const docPaths = docs.map((doc) => doc.path)

export function meta(path: string) {
  const doc = docs.find((page) => page.path === path)
  if (!doc) return null
  return {
    title: `${doc.title} | Doska`,
    /** The title on its own, for the article record's headline. */
    heading: doc.title,
    description: doc.description,
    updated: doc.updated,
  }
}

/**
 * Breadcrumb ancestry for a doc page, nearest ancestor last: `/docs` then the
 * section then the page itself. Only path prefixes that are real pages count,
 * so a section with no `index.md` drops out rather than linking to a 404.
 */
export function trail(path: string) {
  const parts = path.split("/").filter(Boolean)
  const crumbs = []
  for (let i = 0; i < parts.length; i++) {
    const url = "/" + parts.slice(0, i + 1).join("/")
    const doc = docs.find((page) => page.path === url)
    if (doc) crumbs.push({ name: doc.nav, path: url })
  }
  return crumbs
}

/** Every page, in reading order, for the llms.txt index. */
export const outline = docs.map((doc) => ({
  path: doc.path,
  nav: doc.nav,
  description: doc.description,
}))
