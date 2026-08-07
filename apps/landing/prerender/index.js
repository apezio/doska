import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import {
  app,
  docPaths,
  meta,
  outline,
  releases,
  render,
  repo,
  trail,
} from "../dist/server/entry-server.js"
import { head } from "./head.js"
import { llms } from "./llms.js"
import { sitemap } from "./sitemap.js"

const SITE = "https://doska.sh"

/**
 * The home page's `<lastmod>`. Its copy lives in components rather than in
 * frontmatter, so there is nothing to read it off — bump it when the hero or
 * the demo board changes.
 */
const HOME_UPDATED = "2026-08-07"

const dist = fileURLToPath(new URL("../dist/", import.meta.url))
const template = readFileSync(dist + "index.html", "utf-8")

/**
 * A route's file: `/docs` is `docs.html`, not `docs/index.html`, so nginx can
 * answer it from `$uri.html` without a redirect to a trailing slash.
 */
function fileFor(path) {
  return path === "/" ? "index.html" : path.slice(1) + ".html"
}

const paths = ["/", ...docPaths]

for (const path of paths) {
  const info = meta(path)
  const page = info && {
    ...info,
    url: SITE + path,
    crumbs: trail(path),
  }
  const html = head(template, page, SITE).replace(
    "<!--app-html-->",
    render(path)
  )
  const file = dist + fileFor(path)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, html)
}

const entries = paths.map((path) => ({
  path,
  updated: meta(path)?.updated ?? HOME_UPDATED,
}))
writeFileSync(dist + "sitemap.xml", sitemap(SITE, entries))
writeFileSync(
  dist + "llms.txt",
  llms(SITE, { outline, links: { app, repo, releases } })
)

// The SSR bundle is a build artefact, not something we deploy.
rmSync(dist + "server", { recursive: true, force: true })

console.log(`prerendered ${paths.length} pages: ${paths.join(", ")}`)
