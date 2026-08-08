import { eq } from "drizzle-orm"
import { beforeAll, describe, expect, test } from "vitest"
import { auth } from "../src/auth"
import { seedAccount } from "../src/auth/seed"
import { getDB } from "../src/db/get-db"
import { dashboards } from "../src/db/schema"
import { rpcClient, startServer, type Harness } from "./harness"

let h: Harness
let ownerId: string
let secondId: string
let owner: ReturnType<typeof rpcClient>
let second: ReturnType<typeof rpcClient>

const now = 1_000

const push = (title: string, updatedAt: number) => ({
  store: "dashboards" as const,
  record: {
    id: "b1",
    title,
    position: "a",
    prefix: "",
    updatedAt,
    deletedAt: null,
  },
})

async function ownerOf(id: string): Promise<string | null> {
  const [row] = await getDB()
    .select({ ownerId: dashboards.ownerId })
    .from(dashboards)
    .where(eq(dashboards.id, id))
  return row.ownerId
}

beforeAll(async () => {
  h = await startServer()
  owner = rpcClient(h)

  const session = await auth.api.getSession({
    headers: new Headers({ cookie: h.cookie }),
  })
  ownerId = session!.user.id

  const created = await auth.api.createUser({
    body: {
      name: "second",
      email: "second@deck.invalid",
      password: "second-password",
      data: { username: "second", displayUsername: "second" },
    },
    headers: new Headers({ cookie: h.cookie }),
  })
  secondId = created.user.id

  const signIn = await auth.api.signInUsername({
    body: { username: "second", password: "second-password" },
    asResponse: true,
  })
  const cookie = signIn.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ")
  second = rpcClient({ app: h.app, cookie })
})

describe("board ownership", () => {
  // The fresh-install case: migrations backfill before any user exists, so the
  // rows they leave null are the seed's to adopt.
  test("the seed adopts boards left without an owner", async () => {
    await getDB().insert(dashboards).values({
      id: "legacy",
      title: "Legacy",
      position: "a",
      ownerId: null,
      updatedAt: now,
      seq: 1,
    })

    await seedAccount()

    expect(await ownerOf("legacy")).toBe(ownerId)
  })

  test("a new board is owned by whoever pushed it", async () => {
    await second.dashboards.sync({ since: 0, changes: [push("Roadmap", now)] })

    expect(await ownerOf("b1")).toBe(secondId)
  })

  test("another user's push is dropped, row and ownership intact", async () => {
    await second.dashboards.sync({ since: 0, changes: [push("Roadmap", now)] })

    await owner.dashboards.sync({
      since: 0,
      changes: [push("Renamed by the owner", now + 1)],
    })

    const [row] = await getDB()
      .select()
      .from(dashboards)
      .where(eq(dashboards.id, "b1"))
    expect(row.title).toBe("Roadmap")
    expect(row.ownerId).toBe(secondId)
  })
})
