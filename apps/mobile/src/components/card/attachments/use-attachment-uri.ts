import { activeStorage } from "@doska/core/attachments"
import { imageUnavailable } from "@doska/core/attachment-labels"
import { useConnection, type Connection } from "@doska/core/sync"
import { useEffect, useState } from "react"
import { mobileFileCache } from "@/lib/adapters/mobile-files"

type Status = Connection["status"]

// Resolved URIs, so a remount has one on its first render rather than after a
// round trip to disk.
const resolved = new Map<string, string>()

const cacheKey = (cardId: string, key: string) => `${cardId}:${key}`

/**
 * A local URI for one attachment, downloading it through storage the first
 * time. Imperative twin of {@link useAttachmentUri}, for opening a file that
 * nothing on screen has drawn.
 */
export async function attachmentUri(
  cardId: string,
  key: string,
  name: string
): Promise<string> {
  const ck = cacheKey(cardId, key)
  const known = resolved.get(ck)
  if (known) return known

  const found = await mobileFileCache.find(key, name)
  const uri =
    found ??
    (await mobileFileCache.save(
      key,
      name,
      await activeStorage().get(cardId, key)
    ))

  resolved.set(ck, uri)
  return uri
}

interface Resolved {
  /** A local `file://` URI, or null while it resolves and when it can't. */
  uri: string | null
  /** Resolution failed, and nothing but sync coming back would change that. */
  unavailable: boolean
}

/**
 * A local URI for one attachment. Unlike the web, where an `<img>` loads the
 * server route itself, the bytes are fetched here and written to the file
 * cache — which is what makes an attachment openable, and readable offline.
 */
export function useAttachmentUri(
  cardId: string,
  key: string,
  name: string
): Resolved {
  const { status } = useConnection()
  const [state, setState] = useState<{
    key: string
    uri: string | null
    failedAt: Status | null
  }>({ key, uri: null, failedAt: null })

  useEffect(() => {
    const ck = cacheKey(cardId, key)
    if (!key || resolved.has(ck)) return

    let alive = true
    attachmentUri(cardId, key, name)
      .then((uri) => {
        if (alive) setState({ key, uri, failedAt: null })
      })
      .catch(() => {
        if (alive) setState({ key, uri: null, failedAt: status })
      })

    return () => {
      alive = false
    }
  }, [cardId, key, name, status])

  // Cache first; state second, guarded on `key` so a key change doesn't leave
  // the previous image on screen.
  const uri =
    resolved.get(cacheKey(cardId, key)) ??
    (state.key === key ? state.uri : null)

  return {
    uri,
    unavailable: imageUnavailable({
      source: "sync",
      hasUrl: uri !== null,
      failedAt: state.key === key ? state.failedAt : null,
      status,
    }),
  }
}

/** Forgets an attachment's cached bytes, for one being deleted. */
export function dropCachedAttachment(cardId: string, key: string): void {
  resolved.delete(cacheKey(cardId, key))
  void mobileFileCache.forget(key).catch(() => {})
}
