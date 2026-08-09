import { storageFromEnv } from "@doska/file-storage/server"
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { publicAttachmentExists, readPublicBoard } from "../db/public"
import { env } from "../env"
import type { ServerStorage } from "./files"

/**
 * Public board links — the one part of this server that answers without a
 * session.
 *
 * Register it *outside* the guarded scopes in `app.ts`: those add an `onRequest`
 * session check to everything registered inside them, which would make this
 * silently unreachable for the anonymous visitors it exists for.
 *
 * A snapshot, not a sync channel: one request returns the whole board, and the
 * page refetches it on a timer. Nothing here lets a visitor write, and nothing
 * here lands in their IndexedDB.
 */

const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 120

/** Fixed-window per-IP counter. In-process, like better-auth's own default:
 * one node is the deployment shape, and a limiter is not worth a round trip. */
const hits = new Map<string, { count: number; resetAt: number }>()

function overLimit(ip: string, now: number): boolean {
  const bucket = hits.get(ip)
  if (!bucket || now >= bucket.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    // Expired buckets are only ever dropped here, so a burst of one-off IPs
    // cannot leave the map growing without bound.
    if (hits.size > 10_000) {
      for (const [key, value] of hits) if (now >= value.resetAt) hits.delete(key)
    }
    return false
  }
  bucket.count += 1
  return bucket.count > MAX_PER_WINDOW
}

/** True when the request was turned away; the reply is already sent. */
async function rateLimited(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<boolean> {
  if (!env.publicRateLimit) return false
  if (!overLimit(req.ip, Date.now())) return false

  await reply.code(429).send({ error: "Too many requests" })
  return true
}

/** `/api/public/b/<token>/files/<key>` → the key, guarding traversal. */
function attachmentKey(url: string): string | null {
  const raw = url.replace(/^\/api\/public\/b\/[^/]+\/files\//, "").split("?")[0]
  const key = decodeURIComponent(raw)
  if (!key || key.includes("..")) return null
  return key
}

export function registerPublicRoutes(
  app: FastifyInstance,
  storage: ServerStorage | null = storageFromEnv()
): void {
  app.get<{ Params: { token: string } }>(
    "/api/public/b/:token",
    async (req, reply) => {
      if (await rateLimited(req, reply)) return

      const board = await readPublicBoard(req.params.token)
      if (!board) return reply.code(404).send({ error: "Not found" })

      // Anonymous but not shared-cacheable: unpublishing has to take effect on
      // the next load, and a CDN holding the payload would outlive the link.
      reply.header("cache-control", "no-store")
      return reply.send(board)
    }
  )

  // The ordinary `/api/files/*` route sits behind the session check, so a public
  // board's images would all break. This resolves a key only when it belongs to
  // a live card on this very board — the bucket is not opened up, and a key
  // lifted from another board 404s here.
  app.get<{ Params: { token: string } }>(
    "/api/public/b/:token/files/*",
    async (req, reply) => {
      if (await rateLimited(req, reply)) return
      if (!storage)
        return reply.code(503).send({ error: "File storage not configured" })

      const key = attachmentKey(req.url)
      if (!key) return reply.code(400).send({ error: "Bad key" })

      if (!(await publicAttachmentExists(req.params.token, key)))
        return reply.code(404).send({ error: "Not found" })

      try {
        const file = await storage.fetch(key)
        reply.header("content-type", file.contentType)
        if (file.contentLength != null)
          reply.header("content-length", String(file.contentLength))
        reply.header("x-content-type-options", "nosniff")
        reply.header("content-disposition", file.disposition)
        // Unpublishing must kill the image too, so no shared cache holds it.
        reply.header("cache-control", "no-store")
        return reply.send(file.body)
      } catch {
        return reply.code(404).send({ error: "Not found" })
      }
    }
  )
}
