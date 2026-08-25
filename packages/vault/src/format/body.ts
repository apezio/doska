/**
 * The body as the mirror compares and stores it: LF endings, no trailing
 * whitespace, no blank lines before the first one.
 */
export function canonicalBody(body: string): string {
  return body
    .replace(/\r\n?/g, "\n")
    .replace(/^(?:[ \t]*\n)+/, "")
    .replace(/\s+$/, "")
}
