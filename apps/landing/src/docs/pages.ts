import { VFile } from "vfile"
import { matter } from "vfile-matter"

export interface DocPage {
  /** Path it is served at, and the sidebar link's href. */
  path: string
  /** Sidebar label. */
  nav: string
  /** Page heading and, with the site name appended, the `<title>`. */
  title: string
  /** Meta description and the lede under the heading. */
  description: string
  /** Sort order among its siblings. */
  order: number
  /** `YYYY-MM-DD`, the page's `<lastmod>` in the sitemap. */
  updated: string
  /** Optional chip beside the sidebar label, e.g. "Beta". */
  badge?: string
  body: string
}

/** Where `@docs` resolves; see the alias in `vite.config.ts`. */
const DIRECTORY = "/packages/docs/content/"

const sources = import.meta.glob<string>("@docs/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
})

/**
 * `self-hosting/index.md` is `/docs/self-hosting`; `mcp.md`, `/docs/mcp`.
 * Aliased glob keys are absolute paths, so the package directory is cut off.
 */
function pathFor(file: string): string {
  const relative = file
    .slice(file.indexOf(DIRECTORY) + DIRECTORY.length)
    .replace(/\.md$/, "")
    .replace(/(^|\/)index$/, "")
  return relative ? `/docs/${relative}` : "/docs"
}

type Attributes = Omit<DocPage, "path" | "body">

/** Frontmatter is the page's own metadata; a missing field fails the build. */
function read(file: string, source: string): DocPage {
  const vfile = new VFile(source)
  matter(vfile, { strip: true })
  const attributes = (vfile.data.matter ?? {}) as Partial<Attributes>

  for (const key of [
    "title",
    "nav",
    "description",
    "order",
    "updated",
  ] as const)
    if (attributes[key] === undefined)
      throw new Error(`${file}: frontmatter is missing "${key}"`)

  if (!/^\d{4}-\d{2}-\d{2}$/.test(attributes.updated as string))
    throw new Error(
      `${file}: "updated" must be "YYYY-MM-DD", not "${attributes.updated}"`
    )

  return {
    ...(attributes as Attributes),
    path: pathFor(file),
    body: String(vfile),
  }
}

/** 0 for `/docs`, 1 for a page beside it, 2 for one inside a section. */
export function depth(page: DocPage): number {
  return page.path.split("/").length - 2
}

function parentOf(path: string): string {
  return path.slice(0, path.lastIndexOf("/"))
}

function byOrder(a: DocPage, b: DocPage) {
  return a.order - b.order
}

/**
 * Reading order, which is also sidebar order and what previous/next step
 * through: each section by its own `order`, then its children by theirs.
 * `order` is per-section, so children only compete with their siblings.
 */
function ordered(pages: DocPage[]): DocPage[] {
  const sections = pages.filter((page) => depth(page) < 2).sort(byOrder)
  const flat = sections.flatMap((section) => [
    section,
    ...pages
      .filter(
        (page) => depth(page) === 2 && parentOf(page.path) === section.path
      )
      .sort(byOrder),
  ])

  // Only two levels are addressable this way, and the sidebar only draws two.
  // A deeper page would silently vanish from the site, so refuse to build.
  if (flat.length !== pages.length)
    throw new Error("docs: a page is nested deeper than one level")

  return flat
}

export const docs: DocPage[] = ordered(
  Object.entries(sources).map(([file, source]) => read(file, source))
)

export function findDoc(path: string): DocPage | undefined {
  // A trailing slash is the same page; nginx redirects it away in production.
  const clean = path.length > 1 ? path.replace(/\/+$/, "") : path
  return docs.find((doc) => doc.path === clean)
}
