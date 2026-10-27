/** What starting a session on a Miss Claude dashboard came to. */
export type StartResult =
  | { kind: "ok"; name: string }
  | { kind: "login"; msg: string }
  | { kind: "error"; msg: string }

/**
 * Ask a Miss Claude dashboard to start a session on the project in the
 * background. The session joins the project itself once Claude calls
 * register_session, so nothing comes back here but whether it started. A
 * network or CORS failure (an old dashboard without the route, or one that is
 * not reachable) is an error like any other.
 */
export async function startSession(
  dashboardUrl: string,
  projectId: string,
  fetchFn: typeof fetch = fetch
): Promise<StartResult> {
  let res: Response
  try {
    res = await fetchFn(`${dashboardUrl}/doska/start`, {
      method: "POST",
      credentials: "include",
      body: new URLSearchParams({ doska_project: projectId }),
    })
  } catch {
    return { kind: "error", msg: "Couldn't reach the dashboard." }
  }
  const body = (await res.json().catch(() => null)) as {
    ok?: boolean
    login?: boolean
    name?: string
    msg?: string
  } | null
  if (res.ok && body?.ok) return { kind: "ok", name: body.name ?? "a session" }
  const msg = body?.msg || `The dashboard answered ${res.status}.`
  if (body?.login) return { kind: "login", msg }
  return { kind: "error", msg }
}
