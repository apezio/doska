import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { docPaths, meta, render } from "./dist/server/entry-server.js"

const SITE = "https://doska.sh"

const dist = fileURLToPath(new URL("./dist/", import.meta.url))
const template = readFileSync(dist + "index.html", "utf-8")

/**
 * A route's file: `/docs` is `docs.html`, not `docs/index.html`, so nginx can
 * answer it from `$uri.html` without a redirect to a trailing slash.
 */
function fileFor(path) {
  return path === "/" ? "index.html" : path.slice(1) + ".html"
}

function replace(html, pattern, replacement) {
  if (!pattern.test(html)) throw new Error(`prerender: no match for ${pattern}`)
  return html.replace(pattern, replacement)
}

/** Retitles the shared shell for one route. Home keeps the template's copy. */
function head(html, path) {
  const info = meta(path)
  if (!info) return html

  const url = SITE + path
  let out = html
  out = replace(out, /<title>[\s\S]*?<\/title>/, `<title>${info.title}</title>`)
  out = replace(
    out,
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${info.description}" />`
  )
  out = replace(
    out,
    /<link rel="canonical"[^>]*\/>/,
    `<link rel="canonical" href="${url}" />`
  )
  out = replace(
    out,
    /<meta property="og:url"[^>]*\/>/,
    `<meta property="og:url" content="${url}" />`
  )
  for (const [attribute, key, value] of [
    ["property", "og:title", info.title],
    ["property", "og:description", info.description],
    ["name", "twitter:title", info.title],
    ["name", "twitter:description", info.description],
  ]) {
    out = replace(
      out,
      new RegExp(`<meta\\s+${attribute}="${key}"[\\s\\S]*?/>`),
      `<meta ${attribute}="${key}" content="${value}" />`
    )
  }

  out = replace(
    out,
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    ""
  )
  return out
}

const paths = ["/", ...docPaths]

for (const path of paths) {
  const html = head(template, path).replace("<!--app-html-->", render(path))
  const file = dist + fileFor(path)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, html)
}

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...paths.map((path) =>
    [
      "  <url>",
      `    <loc>${SITE}${path === "/" ? "/" : path}</loc>`,
      "    <changefreq>weekly</changefreq>",
      `    <priority>${path === "/" ? "1.0" : "0.7"}</priority>`,
      "  </url>",
    ].join("\n")
  ),
  "</urlset>",
  "",
].join("\n")
writeFileSync(dist + "sitemap.xml", sitemap)

rmSync(dist + "server", { recursive: true, force: true })

console.log(`prerendered ${paths.length} pages: ${paths.join(", ")}`)
