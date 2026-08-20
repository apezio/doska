import { ORPCError } from "@orpc/client"
import { eq } from "drizzle-orm"
import { beforeAll, beforeEach, describe, expect, test } from "vitest"
import { auth } from "../src/auth"
import { getDB } from "../src/db/get-db"
import { boardMembers, user } from "../src/db/schema"
import { rpcClient, resetTables, startServer, type Harness } from "./harness"

let h: Harness
let owner: ReturnType<typeof rpcClient>
let ownerId: string

/** Accounts are made per test, since the point of the suite is deleting them. */
let made = 0

const now = 1_000

const board = (id: string) => ({
  store: "dashboards" as const,
  record: {
    id,
    title: id,
    position: "a",
    updatedAt: now,
    deletedAt: null,
  },
})

async function statusOf(run: Promise<unknown>): Promise<number | undefined> {
  try {
    await run
    return undefined
  } catch (err) {
    return err instanceof ORPCError ? err.status : -1
  }
}

/** A fresh account, plus a client signed in as it. */
async function makeAccount(): Promise<{
  id: string
  client: ReturnType<typeof rpcClient>
}> {
  const username = `spare-${++made}`
  const password = "spare-password"

  const created = await auth.api.createUser({
    body: {
      name: username,
      email: `${username}@deck.invalid`,
      password,
      data: { username, displayUsername: username },
    },
    headers: new Headers({ cookie: h.cookie }),
  })

  const signIn = await auth.api.signInUsername({
    body: { username, password },
    asResponse: true,
  })
  const cookie = signIn.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ")

  return { id: created.user.id, client: rpcClient({ app: h.app, cookie }) }
}

/** What the UI's Deactivate button does, without going through the plugin. */
async function deactivate(id: string): Promise<void> {
  await getDB().update(user).set({ banned: true }).where(eq(user.id, id))
}

const exists = async (id: string) =>
  (await getDB().select({ id: user.id }).from(user).where(eq(user.id, id)))
    .length === 1

beforeAll(async () => {
  h = await startServer()
  owner = rpcClient(h)

  const session = await auth.api.getSession({
    headers: new Headers({ cookie: h.cookie }),
  })
  ownerId = session!.user.id
})

beforeEach(async () => {
  await resetTables()
  await owner.dashboards.sync({ since: 0, changes: [board("b1")] })
})

describe("accounts.remove", () => {
  test("refuses an account that is still active", async () => {
    const spare = await makeAccount()

    expect(await statusOf(owner.accounts.remove({ userId: spare.id }))).toBe(400)
    expect(await exists(spare.id)).toBe(true)
  })

  test("refuses an account that still owns a board", async () => {
    const spare = await makeAccount()
    await spare.client.dashboards.sync({ since: 0, changes: [board("theirs")] })
    await deactivate(spare.id)

    try {
      await owner.accounts.remove({ userId: spare.id })
      throw new Error("expected the delete to be refused")
    } catch (err) {
      expect(err).toBeInstanceOf(ORPCError)
      expect((err as ORPCError<string, unknown>).message).toContain("1 board")
    }
    expect(await exists(spare.id)).toBe(true)
  })

  test("deletes a deactivated account, revoking what was shared with it", async () => {
    const spare = await makeAccount()
    await owner.members.add({ boardId: "b1", userId: spare.id })
    const [granted] = await getDB().select().from(boardMembers)
    await deactivate(spare.id)

    await owner.accounts.remove({ userId: spare.id })

    expect(await exists(spare.id)).toBe(false)

    // The row outlives the account: its `seq` is how the board's owner learns.
    const rows = await getDB().select().from(boardMembers)
    expect(rows).toHaveLength(1)
    expect(rows[0].revokedAt).not.toBeNull()
    expect(rows[0].seq).toBeGreaterThan(granted.seq)

    const { members } = await owner.members.list({ boardId: "b1" })
    expect(members.map((m) => m.userId)).toEqual([ownerId])
  })

  test("a board it owned only in the trash is no obstacle", async () => {
    const spare = await makeAccount()
    await spare.client.dashboards.sync({ since: 0, changes: [board("theirs")] })
    await spare.client.dashboards.sync({
      since: 0,
      changes: [
        {
          store: "dashboards",
          record: {
            ...board("theirs").record,
            deletedAt: now + 1,
            updatedAt: now + 1,
          },
        },
      ],
    })
    await deactivate(spare.id)

    await owner.accounts.remove({ userId: spare.id })
    expect(await exists(spare.id)).toBe(false)
  })

  test("only an admin may delete, and never itself", async () => {
    const spare = await makeAccount()
    const other = await makeAccount()
    await deactivate(other.id)

    expect(
      await statusOf(spare.client.accounts.remove({ userId: other.id }))
    ).toBe(403)
    expect(await statusOf(owner.accounts.remove({ userId: ownerId }))).toBe(400)
    expect(await exists(ownerId)).toBe(true)
  })

  test("ownedBoards counts the live ones, for an admin only", async () => {
    const spare = await makeAccount()
    expect(await owner.accounts.ownedBoards({ userId: spare.id })).toEqual({
      boards: 0,
    })

    await spare.client.dashboards.sync({ since: 0, changes: [board("theirs")] })
    expect(await owner.accounts.ownedBoards({ userId: spare.id })).toEqual({
      boards: 1,
    })

    expect(
      await statusOf(spare.client.accounts.ownedBoards({ userId: spare.id }))
    ).toBe(403)
  })

  test("an account that is not there is a 404", async () => {
    expect(await statusOf(owner.accounts.remove({ userId: "nobody" }))).toBe(404)
  })
})
