import type { Card } from "@doska/contract"
import { canonicalBody } from "../format/body"

/**
 * The card as the vault sees it
 */
export interface Projection {
  id: string
  title: string
  body: string
  deadline: string | null
  priority: string
}

export function projectionOf(card: Card): Projection {
  return {
    id: card.id,
    title: card.title,
    body: canonicalBody(card.body),
    deadline: card.deadline || null,
    priority: card.priority || "",
  }
}

export async function hashProjection(projection: Projection): Promise<string> {
  const canonical = JSON.stringify([
    projection.id,
    projection.title,
    projection.body,
    projection.deadline,
    projection.priority,
  ])
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonical)
  )
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}
