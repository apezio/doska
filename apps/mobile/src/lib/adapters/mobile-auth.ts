import type { Auth } from "@doska/ports"

/**
 * Deliberately holds nothing yet. Mobile is desktop's bearer-token story, but
 * the token belongs in SecureStore rather than the KV file, and nothing signs in
 * until sync lands — so DSK-76 implements this rather than Phase 2 leaving a
 * session token sitting in plain SQLite in the meantime.
 */
export const mobileAuth: Auth = {
  token: () => null,
  capture: () => {},
  clear: () => {},
}
