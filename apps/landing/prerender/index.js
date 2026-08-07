import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { docPaths, meta, render } from "../dist/server/entry-server.js"
import { head } from "./head.js"
import { sitemap } from "./sitemap.js"

const SITE = "https://doska.sh"

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
  const html = head(template, info && { ...info, url: SITE + path }).replace(
    "<!--app-html-->",
    render(path)
  )
  const file = dist + fileFor(path)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, html)
}

writeFileSync(dist + "sitemap.xml", sitemap(SITE, paths))

// The SSR bundle is a build artefact, not something we deploy.
rmSync(dist + "server", { recursive: true, force: true })

console.log(`prerendered ${paths.length} pages: ${paths.join(", ")}`)
