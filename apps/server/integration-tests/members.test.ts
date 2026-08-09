import { RETENTION_MS } from "@doska/contract"
import { eq } from "drizzle-orm"
import { beforeAll, beforeEach, describe, expect, test } from "vitest"
import { auth } from "../src/auth"
import { boardAccess } from "../src/db/access"
import { getDB } from "../src/db/get-db"
import { boardMembers, counters, dashboards } from "../src/db/schema"
import { writeMembers } from "../src/db/sync/members"
import { purgeExpired } from "../src/db/sync/purge"
import { rpcClient, resetTables, startServer, type Harness } from "./harness"

let h: Harness
let ownerId: string
let memberId: string
let owner: ReturnType<typeof rpcClient>

const now = 1_000_000_000_000

const board = (id: string, deletedAt: number | null = null) => ({
  store: "dashboards" as const,
  record: {
    id,
    title: id,
    position: "a",
    prefix: "",
    updatedAt: now,
    deletedAt,
  },
})

const boardsListSeq = async () => {
  const [row] = await getDB()
    .select({ value: counters.value })
    .from(counters)
    .where(eq(counters.id, "boards-list"))
  return row?.value ?? 0
}

const memberRows = () => getDB().select().from(boardMembers)

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
})

beforeEach(resetTables)

describe("boardAccess", () => {
  test("tells owner, member, denied and unknown apart", async () => {
    await owner.dashboards.sync({ since: 0, changes: [board("b1")] })

    expect(await boardAccess(ownerId, "b1")).toBe("owner")
    expect(await boardAccess(memberId, "b1")).toBe("denied")
    expect(await boardAccess(memberId, "nosuchboard")).toBe("unknown")

    await writeMembers([{ boardId: "b1", userId: memberId }], now)
    expect(await boardAccess(memberId, "b1")).toBe("member")
  })

  test("revoking keeps the row, advances its seq and denies again", async () => {
    await owner.dashboards.sync({ since: 0, changes: [board("b1")] })
    await writeMembers([{ boardId: "b1", userId: memberId }], now)
    const [granted] = await memberRows()

    await writeMembers(
      [{ boardId: "b1", userId: memberId, revokedAt: now + 1 }],
      now + 1
    )

    const rows = await memberRows()
    expect(rows).toHaveLength(1)
    expect(rows[0].revokedAt).toBe(now + 1)
    expect(rows[0].seq).toBeGreaterThan(granted.seq)
    expect(await boardAccess(memberId, "b1")).toBe("denied")
  })
})

describe("writeMembers", () => {
  test("consecutive seq values, counter left at the highest", async () => {
    await owner.dashboards.sync({ since: 0, changes: [board("b1")] })
    const before = await boardsListSeq()

    await writeMembers(
      [
        { boardId: "b1", userId: memberId },
        { boardId: "b1", userId: ownerId, role: "owner" },
      ],
      now
    )

    const seqs = (await memberRows()).map((r) => r.seq).sort((a, b) => a - b)
    expect(seqs).toEqual([before + 1, before + 2])
    expect(await boardsListSeq()).toBe(before + 2)
  })

  test("the board-list seq it takes is past the board's own", async () => {
    await owner.dashboards.sync({ since: 0, changes: [board("b1")] })
    const [dash] = await getDB()
      .select({ seq: dashboards.seq })
      .from(dashboards)

    await writeMembers([{ boardId: "b1", userId: memberId }], now)

    expect((await memberRows())[0].seq).toBeGreaterThan(dash.seq)
  })
})

describe("purgeExpired", () => {
  test("drops membership of a purged board, keeps the rest", async () => {
    const stale = now - RETENTION_MS - 1

    await owner.dashboards.sync({
      since: 0,
      changes: [board("live"), board("stale", stale)],
    })
    await writeMembers(
      [
        { boardId: "live", userId: memberId },
        { boardId: "stale", userId: memberId },
        // A revoked row is still a row: it goes with its board, not before it.
        { boardId: "stale", userId: ownerId, revokedAt: stale },
      ],
      now
    )

    const result = await purgeExpired(now)

    expect(result).toMatchObject({ dashboards: 1, members: 2 })
    expect((await memberRows()).map((r) => r.boardId)).toEqual(["live"])
  })
})
