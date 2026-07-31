/**
 * The interfaces that stand between the shared code and a platform. Every one is
 * a type — this package emits nothing at runtime — and each has one
 * implementation per platform, injected at startup rather than picked by a
 * sniff at the call site.
 *
 * | Port          | Backed on web by                     |
 * | ------------- | ------------------------------------ |
 * | `ClientDB`    | IndexedDB                            |
 * | `KeyValue`    | localStorage                         |
 * | `Http`        | `fetch` against the page's origin    |
 * | `Auth`        | the session cookie                   |
 * | `Files`       | the S3 storage adapter               |
 * | `Net`         | `navigator.onLine`                   |
 * | `Foreground`  | `document.visibilityState`           |
 *
 * Two of them predate this package and keep their definitions where their
 * adapters live; they are re-exported so callers have one place to import from.
 */

// The interface subpaths, not the package roots: those also export the web
// adapters, and importing one drags `lib.dom` into every neutral package's
// program.
export type { ClientDB, KeyRange, Query } from "@doska/client-db/client-db"
export type {
  FileInput,
  FileStorage as Files,
  StoredFile,
} from "@doska/file-storage/file-storage"

export type { KeyValue } from "./key-value"
export type { Http } from "./http"
export type { Auth } from "./auth"
export type { Net } from "./net"
export type { Foreground } from "./foreground"
