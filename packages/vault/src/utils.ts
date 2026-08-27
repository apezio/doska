export function snakeName(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .slice(0, 60)
    .replace(/^_+|_+$/g, "")
}

/** The folder a file sits in. */
export function dirOf(path: string): string {
  return path.slice(0, path.lastIndexOf("/"))
}

/** A file's name without its `.md`. */
export function stemOf(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1).replace(/\.md$/, "")
}
