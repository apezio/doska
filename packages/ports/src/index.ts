/**
 * The six interfaces that stand between the shared code and a platform. Every
 * one is a type — this package emits nothing at runtime — and each has one
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
 *
 * Two of them predate this package and keep their definitions where their
 * adapters live; they are re-exported so callers have one place to import from.
 */

export type { ClientDB, KeyRange, Query } from "@doska/client-db"
export type {
  FileInput,
  FileStorage as Files,
  StoredFile,
} from "@doska/file-storage"

export type { KeyValue } from "./key-value"
export type { Http } from "./http"
export type { Auth } from "./auth"
export type { Net } from "./net"
