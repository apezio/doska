/**
 * Every route is rendered into the one `index.html` Vite emits, so each page's
 * own title, description and canonical URL have to be swapped into that shared
 * shell here. Pure string work: the caller supplies the copy.
 */

function replace(html, pattern, replacement) {
  if (!pattern.test(html)) throw new Error(`prerender: no match for ${pattern}`)
  return html.replace(pattern, replacement)
}

/**
 * Retitles the shell for one route. `page` is `null` for the home page, which
 * is what the template already describes.
 */
export function head(html, page) {
  if (!page) return html

  let out = html
  out = replace(out, /<title>[\s\S]*?<\/title>/, `<title>${page.title}</title>`)
  out = replace(
    out,
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${page.description}" />`
  )
  out = replace(
    out,
    /<link rel="canonical"[^>]*\/>/,
    `<link rel="canonical" href="${page.url}" />`
  )
  out = replace(
    out,
    /<meta property="og:url"[^>]*\/>/,
    `<meta property="og:url" content="${page.url}" />`
  )
  for (const [attribute, key, value] of [
    ["property", "og:title", page.title],
    ["property", "og:description", page.description],
    ["name", "twitter:title", page.title],
    ["name", "twitter:description", page.description],
  ]) {
    out = replace(
      out,
      new RegExp(`<meta\\s+${attribute}="${key}"[\\s\\S]*?/>`),
      `<meta ${attribute}="${key}" content="${value}" />`
    )
  }
  // The SoftwareApplication record describes the app, not an article about it.
  out = replace(
    out,
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    ""
  )
  return out
}
