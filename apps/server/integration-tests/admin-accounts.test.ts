import { beforeAll, describe, expect, test } from "vitest"
import { auth } from "../src/auth"
import { startServer, type Harness } from "./harness"

let h: Harness

const second = {
  name: "second",
  email: "second@deck.invalid",
  password: "second-password",
  // `createUser` takes only better-auth's core fields inline; the username
  // plugin's columns ride along in `data`.
  data: { username: "second", displayUsername: "second" },
}

beforeAll(async () => {
  h = await startServer()
})

/** `createUser` reads the caller's session off the headers, not a cookie jar. */
function asOwner(): Headers {
  return new Headers({ cookie: h.cookie })
}

describe("admin accounts", () => {
  test("the seeded owner is an admin", async () => {
    const session = await auth.api.getSession({ headers: asOwner() })
    expect(session?.user.role).toBe("admin")
  })

  test("the owner can create a second account, which can sign in", async () => {
    await auth.api.createUser({ body: second, headers: asOwner() })

    const res = await h.app.inject({
      method: "POST",
      url: "/api/auth/sign-in/username",
      headers: { "content-type": "application/json" },
      payload: JSON.stringify({
        username: second.data.username,
        password: second.password,
      }),
    })
    expect(res.statusCode).toBe(200)
    expect(res.headers["set-cookie"]).toBeDefined()
  })

  // The sign-up blocker sits on /api/auth/sign-up*; the admin route must not be
  // caught by it, since the account UI calls it over HTTP.
  test("the create-user route is reachable over HTTP", async () => {
    const res = await h.app.inject({
      method: "POST",
      url: "/api/auth/admin/create-user",
      headers: { "content-type": "application/json", cookie: h.cookie },
      payload: JSON.stringify({
        name: "third",
        email: "third@deck.invalid",
        password: "third-password",
        data: { username: "third", displayUsername: "third" },
      }),
    })
    expect(res.statusCode).toBe(200)
  })

  test("a non-admin cannot create accounts", async () => {
    const signIn = await auth.api.signInUsername({
      body: { username: second.data.username, password: second.password },
      asResponse: true,
    })
    const cookie = signIn.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ")

    await expect(
      auth.api.createUser({
        body: {
          name: "fourth",
          email: "fourth@deck.invalid",
          password: "fourth-password",
        },
        headers: new Headers({ cookie }),
      })
    ).rejects.toThrow()
  })

  /**
   * Last, because it leaves `second` deactivated. A session cookie carries a
   * cached copy of itself (`session.cookieCache`), so a guard that trusts the
   * cookie keeps a deactivated account working for the rest of its `maxAge` —
   * a minute of access after the owner cut it off.
   */
  test("deactivating an account closes the private routes at once", async () => {
    const signIn = await h.app.inject({
      method: "POST",
      url: "/api/auth/sign-in/username",
      headers: { "content-type": "application/json" },
      payload: JSON.stringify({
        username: second.data.username,
        password: second.password,
      }),
    })
    const cookie = signIn.headers["set-cookie"] as string[]
    const request = {
      method: "POST",
      // Any path under the guarded scope: what the procedure makes of the empty
      // body is beside the point, only whether the request gets that far.
      url: "/api/rpc/board/sync",
      headers: { cookie: cookie.map((c) => c.split(";")[0]).join("; ") },
    } as const

    const before = await h.app.inject(request)
    expect(before.statusCode).not.toBe(401)

    const { users } = await auth.api.listUsers({
      query: { searchField: "name", searchValue: second.name },
      headers: asOwner(),
    })
    const target = users.find((u) => u.name === second.name)
    expect(target).toBeDefined()
    await auth.api.banUser({
      body: { userId: target!.id },
      headers: asOwner(),
    })

    const after = await h.app.inject(request)
    expect(after.statusCode).toBe(401)
  })
})
