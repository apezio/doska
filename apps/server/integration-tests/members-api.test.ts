import { ORPCError } from "@orpc/client"
import { eq } from "drizzle-orm"
import { beforeAll, beforeEach, describe, expect, test } from "vitest"
import { auth } from "../src/auth"
import { getDB } from "../src/db/get-db"
import { boardMembers, counters } from "../src/db/schema"
import { rpcClient, resetTables, startServer, type Harness } from "./harness"

let h: Harness
let owner: ReturnType<typeof rpcClient>
let member: ReturnType<typeof rpcClient>
let ownerId: string
let memberId: string

const now = 1_000

const board = (id: string) => ({
  store: "dashboards" as const,
  record: {
    id,
    title: id,
    position: "a",
    prefix: "",
    updatedAt: now,
    deletedAt: null,
  },
})

const memberRows = () => getDB().select().from(boardMembers)

const boardsListSeq = async () => {
  const [row] = await getDB()
    .select({ value: counters.value })
    .from(counters)
    .where(eq(counters.id, "boards-list"))
  return row?.value ?? 0
}

async function statusOf(run: Promise<unknown>): Promise<number | undefined> {
  try {
    await run
    return undefined
  } catch (err) {
    return err instanceof ORPCError ? err.status : -1
  }
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
      name: "member",
      email: "member@deck.invalid",
      password: "member-password",
      data: { username: "member", displayUsername: "member" },
    },
    headers: new Headers({ cookie: h.cookie }),
  })
  memberId = created.user.id

  const signIn = await auth.api.signInUsername({
    body: { username: "member", password: "member-password" },
    asResponse: true,
  })
  const cookie = signIn.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ")
  member = rpcClient({ app: h.app, cookie })
})

beforeEach(async () => {
  await resetTables()
  await owner.dashboards.sync({ since: 0, changes: [board("b1")] })
})

describe("members.add / remove / list", () => {
  test("an added account shows up in the list", async () => {
    await owner.members.add({ boardId: "b1", userId: memberId })

    const { members } = await owner.members.list({ boardId: "b1" })
    expect(members).toEqual([
      { userId: memberId, username: "member", role: "editor" },
    ])
  })

  test("removing keeps the row, revoked and re-stamped, and empties the list", async () => {
    await owner.members.add({ boardId: "b1", userId: memberId })
    const [granted] = await memberRows()

    await owner.members.remove({ boardId: "b1", userId: memberId })

    const rows = await memberRows()
    expect(rows).toHaveLength(1)
    expect(rows[0].revokedAt).not.toBeNull()
    expect(rows[0].seq).toBeGreaterThan(granted.seq)

    const { members } = await owner.members.list({ boardId: "b1" })
    expect(members).toEqual([])
  })

  test("re-adding revives the one row rather than inserting a second", async () => {
    await owner.members.add({ boardId: "b1", userId: memberId })
    await owner.members.remove({ boardId: "b1", userId: memberId })
    const [revoked] = await memberRows()

    await owner.members.add({ boardId: "b1", userId: memberId })

    const rows = await memberRows()
    expect(rows).toHaveLength(1)
    expect(rows[0].revokedAt).toBeNull()
    expect(rows[0].seq).toBeGreaterThan(revoked.seq)

    const { members } = await owner.members.list({ boardId: "b1" })
    expect(members.map((m) => m.userId)).toEqual([memberId])
  })

  test("each membership write advances the board-list counter by exactly one", async () => {
    const before = await boardsListSeq()

    await owner.members.add({ boardId: "b1", userId: memberId })
    expect(await boardsListSeq()).toBe(before + 1)

    await owner.members.remove({ boardId: "b1", userId: memberId })
    expect(await boardsListSeq()).toBe(before + 2)

    // A read is not a write.
    await owner.members.list({ boardId: "b1" })
    expect(await boardsListSeq()).toBe(before + 2)
  })
})

describe("every members procedure is owner-only", () => {
  test("a member cannot list, add or remove", async () => {
    await owner.members.add({ boardId: "b1", userId: memberId })

    expect(await statusOf(member.members.list({ boardId: "b1" }))).toBe(403)
    expect(
      await statusOf(member.members.add({ boardId: "b1", userId: ownerId }))
    ).toBe(403)
    expect(
      await statusOf(member.members.remove({ boardId: "b1", userId: memberId }))
    ).toBe(403)

    expect(await memberRows()).toHaveLength(1)
  })

  test("a stranger's board is 403 too, member row or not", async () => {
    expect(
      await statusOf(member.members.add({ boardId: "b1", userId: memberId }))
    ).toBe(403)
    expect(await memberRows()).toHaveLength(0)
  })
})

describe("the board's own owner is not a member", () => {
  test("adding or removing them is refused and writes nothing", async () => {
    const before = await boardsListSeq()

    expect(
      await statusOf(owner.members.add({ boardId: "b1", userId: ownerId }))
    ).toBe(400)
    expect(
      await statusOf(owner.members.remove({ boardId: "b1", userId: ownerId }))
    ).toBe(400)

    expect(await memberRows()).toHaveLength(0)
    expect(await boardsListSeq()).toBe(before)
  })
})

describe("users.list", () => {
  test("a non-admin session gets id and username, nothing else", async () => {
    const { users } = await member.users.list()

    expect(users.map((u) => u.username).sort()).toEqual(["member", "tester"])
    for (const u of users)
      expect(Object.keys(u).sort()).toEqual(["id", "username"])
    expect(users.find((u) => u.id === ownerId)).toBeDefined()
  })

  test("a deactivated account drops out of the directory", async () => {
    await auth.api.banUser({
      body: { userId: memberId },
      headers: new Headers({ cookie: h.cookie }),
    })

    const { users } = await owner.users.list()
    expect(users.map((u) => u.username)).toEqual(["tester"])

    await auth.api.unbanUser({
      body: { userId: memberId },
      headers: new Headers({ cookie: h.cookie }),
    })
  })
})
