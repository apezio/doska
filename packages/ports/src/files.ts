import type { FileInput } from "@doska/file-storage/file-storage"

/**
 * Choosing files off the device. A browser has `<input type="file">` and a
 * `File` to hand straight to storage; React Native has neither, so the picker
 * is a port and the bytes it returns are read for it.
 */
export interface FilePicker {
  /** Opens the platform's document picker. Empty when the user cancels. */
  pick(): Promise<FileInput[]>
}

/**
 * Where fetched attachment bytes live so the platform can show them by URI.
 * A browser keeps them in memory behind an object URL; a phone writes them to
 * disk, which is also what makes an attachment readable offline.
 */
export interface FileCache {
  /** The local URI for `key`, or null when its bytes were never cached. */
  find(key: string, name: string): Promise<string | null>
  /** Caches `bytes` under `key` and returns their local URI. */
  save(key: string, name: string, bytes: Blob): Promise<string>
  /** Drops the cached copy; a key that was never cached is not an error. */
  forget(key: string): Promise<void>
}
