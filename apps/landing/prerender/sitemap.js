/** The sitemap is generated from the route list so it can't drift from it. */
export function sitemap(site, paths) {
  const urls = paths.map((path) =>
    [
      "  <url>",
      `    <loc>${site}${path}</loc>`,
      "    <changefreq>weekly</changefreq>",
      `    <priority>${path === "/" ? "1.0" : "0.7"}</priority>`,
      "  </url>",
    ].join("\n")
  )

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n")
}
