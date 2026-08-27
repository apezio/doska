import type { VaultFs } from "@doska/vault"

/** Long enough that saving a file in an editor lands as one change, not three. */
const DEBOUNCE_MS = 400

/**
 * The vault's filesystem on the desktop. Everything is imported lazily so the
 * web build never pulls the Tauri plugin in.
 */
export const tauriFs: VaultFs = {
  async read(path) {
    const { exists, readTextFile } = await import("@tauri-apps/plugin-fs")
    if (!(await exists(path))) return null
    return readTextFile(path)
  },

  async write(path, content) {
    const { writeTextFile } = await import("@tauri-apps/plugin-fs")
    await writeTextFile(path, content)
  },

  async mkdir(path) {
    const { mkdir } = await import("@tauri-apps/plugin-fs")
    await mkdir(path, { recursive: true })
  },

  async rename(from, to) {
    const { rename } = await import("@tauri-apps/plugin-fs")
    await rename(from, to)
  },

  async readDir(path) {
    const { exists, readDir } = await import("@tauri-apps/plugin-fs")
    if (!(await exists(path))) return null
    const entries = await readDir(path)
    return entries.filter((e) => !e.isDirectory).map((e) => e.name)
  },

  async watch(path, listener) {
    const { watch } = await import("@tauri-apps/plugin-fs")
    return watch(path, () => listener(), {
      recursive: true,
      delayMs: DEBOUNCE_MS,
    })
  },
}
