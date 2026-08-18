import type { FileCache, FileInput, FilePicker } from "@doska/ports"
import { Directory, File, Paths } from "expo-file-system"

const ROOT = "attachments"

// Storage keys carry a `/`, which a path segment cannot.
function folder(key: string): string {
  return key.replace(/[^a-zA-Z0-9._-]/g, "_")
}

/** One folder per key so the file inside keeps its own name — which is what
 * QuickLook and the share sheet read the type from. */
function cached(key: string, name: string): File {
  return new File(Paths.cache, ROOT, folder(key), name)
}

/** Bytes as base64, the one encoding both a React Native `Blob` and
 * `File.write` can speak. */
function toBase64(bytes: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error("read failed"))
    reader.onload = () => {
      const url = String(reader.result)
      resolve(url.slice(url.indexOf(",") + 1))
    }
    reader.readAsDataURL(bytes)
  })
}

/**
 * The system document picker. `expo-file-system` carries one, so this needs no
 * native module the app doesn't already build.
 */
export const mobileFilePicker: FilePicker = {
  async pick(): Promise<FileInput[]> {
    const picked = await File.pickFileAsync({ multipleFiles: true })
    if (picked.canceled) return []

    return Promise.all(
      picked.result.map(async (file) => ({
        name: file.name,
        mime: file.type || "application/octet-stream",
        // A request body cannot carry a React Native `Blob`.
        bytes: await file.bytes(),
      }))
    )
  },
}

/**
 * The photo library, which the document picker cannot see: on iOS it is not a
 * folder but a separate system picker.
 */
export const mobilePhotoPicker: FilePicker = {
  async pick(): Promise<FileInput[]> {
    // Loaded here, not at the top: importing it asks for a native module, which
    // a dev client built before this dependency does not carry.
    const { launchImageLibraryAsync } = await import("expo-image-picker")
    const picked = await launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
    })
    if (picked.canceled) return []

    return Promise.all(
      picked.assets.map(async (asset) => {
        const file = new File(asset.uri)
        return {
          name: asset.fileName || file.name,
          mime: asset.mimeType || file.type || "application/octet-stream",
          bytes: await file.bytes(),
        }
      })
    )
  },
}

/**
 * Downloaded attachments, in the cache directory: the system may reclaim it
 * under storage pressure, and a missing file only costs another download.
 */
export const mobileFileCache: FileCache = {
  find(key, name) {
    const file = cached(key, name)
    return Promise.resolve(file.exists ? file.uri : null)
  },

  async save(key, name, bytes) {
    const file = cached(key, name)
    file.parentDirectory.create({ intermediates: true, idempotent: true })
    file.write(await toBase64(bytes), { encoding: "base64" })
    return file.uri
  },

  forget(key) {
    const dir = new Directory(Paths.cache, ROOT, folder(key))
    if (dir.exists) dir.delete()
    return Promise.resolve()
  },
}
