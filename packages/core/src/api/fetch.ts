import { runtime } from "../runtime"

/**
 * `fetch` with no session attached — the platform's raw transport.
 *
 * This is what better-auth's own client is built on — see `auth-client`.
 */
export const rawFetch: typeof fetch = (input, init) =>
  runtime().http.fetch(input, init)

/** `fetch` carrying the session: a cookie, or a bearer token where there is one. */
export const appFetch: typeof fetch = async (input, init) => {
  const headers = new Headers(
    init?.headers ?? (input instanceof Request ? input.headers : undefined)
  )
  const token = runtime().auth.token()
  if (token) headers.set("authorization", `Bearer ${token}`)

  return rawFetch(input, { ...init, credentials: "include", headers })
}
