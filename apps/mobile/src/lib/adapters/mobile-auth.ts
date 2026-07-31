import type { Auth } from "@doska/ports"
import { deleteItemAsync, getItem, setItem } from "expo-secure-store"

// SecureStore keys allow only alphanumerics, `.`, `-` and `_` — the `deck:`
// prefix the other stores use is rejected outright.
const TOKEN_KEY = "deck.session-token"

/**
 * Mobile is desktop's bearer-token story with the keychain underneath it: the
 * server echoes the token on `set-auth-token` and it is sent from then on.
 *
 * The value is mirrored in memory because {@link Auth.token} is synchronous and
 * runs on every request, while a SecureStore read crosses into the keychain.
 * SecureStore stays the durable copy; this is only the hot path.
 */
let token = read()

function read(): string | null {
  try {
    return getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export const mobileAuth: Auth = {
  token: () => token,
  capture: (next) => {
    token = next
    try {
      setItem(TOKEN_KEY, next)
    } catch {
      // The port promises not to throw. The session still works for this run,
      // it just won't survive a restart.
    }
  },
  clear: () => {
    token = null
    // Deletion has no synchronous form. Nothing waits on it: the in-memory copy
    // is what every reader sees, so the session is already gone.
    void deleteItemAsync(TOKEN_KEY).catch(() => {})
  },
}
