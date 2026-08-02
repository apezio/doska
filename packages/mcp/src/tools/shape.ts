import type { Card } from "@doska/contract"
import { cardDisplayId } from "@doska/contract/prefix"
import { taskProgress } from "@doska/markdown"

/**
 * How a card goes back to a client: the ids it can be addressed by, its
 * deadline, its task-list progress, and its attachments by name only — the
 * bytes live behind the app's file endpoints, not the sync channel.
 */
export function shapeCard(card: Card, prefix: string) {
  const { done, total } = taskProgress(card.body)
  return {
    id: card.id,
    // The human-readable id automations reference, e.g. ROAD-12.
    cardId: cardDisplayId(prefix, card.number),
    title: card.title,
    body: card.body,
    deadline: card.deadline,
    tasks: total > 0 ? { done, total } : null,
    attachments: card.attachments.map(({ name, mime, size }) => ({
      name,
      mime,
      size,
    })),
  }
}
