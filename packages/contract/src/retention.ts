/**
 * How long a tombstoned record stays restorable from the trash. Past it, both
 * ends hard-delete it independently — the client on its retention sweep, the
 * server on its purge job — so neither has to tell the other it happened.
 */
export const RETENTION_MS = 14 * 24 * 60 * 60 * 1000

/**
 * How long a session's claim on a step stays live after its last activity.
 * A session that has gone quiet this long no longer blocks another from
 * claiming its step, and the brief shows the step as free.
 */
export const STEP_CLAIM_MS = 30 * 60 * 1000

/** Whether a session's step claim is still live at `now`. */
export const claimLive = (lastActivityAt: number | null, now: number) =>
  lastActivityAt !== null && now - lastActivityAt < STEP_CLAIM_MS
