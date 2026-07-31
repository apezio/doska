import type { Net } from "@doska/ports"

/**
 * Only the sync engine reads this, and sync starts in DSK-76 — which is also
 * where NetInfo arrives. Claiming online until then is the safe direction: the
 * port is explicit that it never gates an attempt, only names a failure.
 */
export const mobileNet: Net = {
  online: () => true,
  subscribe: () => () => {},
}
