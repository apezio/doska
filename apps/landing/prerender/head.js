/**
 * Every route is rendered into the one `index.html` Vite emits, so each page's
 * own title, description and canonical URL have to be swapped into that shared
 * shell here. Pure string work: the caller supplies the copy.
 */

function replace(html, pattern, replacement) {
  if (!pattern.test(html)) throw new Error(`prerender: no match for ${pattern}`)
  return html.replace(pattern, replacement)
}

/** A `</script>` anywhere in the copy would close the block early. */
function json(value) {
  return JSON.stringify(value, null, 2).replace(/</g, "\\u003c")
}

/**
 * The shell's record describes the app, which is what the home page is about.
 * A doc page is an article about part of it, sitting somewhere in the docs
 * tree, so it gets its own pair of records instead.
 */
function structuredData(page, site) {
  const crumbs = [{ name: "Doska", path: "/" }, ...page.crumbs]

  return json({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        headline: page.heading,
        description: page.description,
        url: page.url,
        dateModified: page.updated,
        inLanguage: "en",
        author: { "@type": "Person", name: "Rita Romenkova" },
        isPartOf: {
          "@type": "WebSite",
          name: "Doska",
          url: site + "/",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((crumb, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: crumb.name,
          item: site + crumb.path,
        })),
      },
    ],
  })
}

/**
 * Retitles the shell for one route. `page` is `null` for the home page, which
 * is what the template already describes.
 */
export function head(html, page, site) {
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
    // The shell says "website", which is true of the home page only.
    ["property", "og:type", "article"],
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
  out = replace(
    out,
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">\n${structuredData(page, site)}\n</script>`
  )
  return out
}
