import { ORPCError } from "@orpc/client"
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest"
import { auth } from "../src/auth"
import { getDB } from "../src/db/get-db"
import { projectEvents } from "../src/db/schema"
import { rpcClient, resetTables, startServer, type Harness } from "./harness"

let h: Harness
let owner: ReturnType<typeof rpcClient>
let other: ReturnType<typeof rpcClient>

const now = 1_000

const board = (id: string) => ({
  store: "dashboards" as const,
  record: {
    id,
    title: `Board ${id}`,
    position: "a",
    updatedAt: now,
    deletedAt: null,
  },
})

const column = (id: string, dashboardId: string, done = false) => ({
  store: "columns" as const,
  record: {
    id,
    title: id,
    position: "a",
    dashboardId,
    done,
    updatedAt: now,
    deletedAt: null,
  },
})

const card = (id: string, columnId: string, updatedAt = now) => ({
  store: "cards" as const,
  record: {
    id,
    title: `Card ${id}`,
    body: "",
    position: "a",
    columnId,
    number: null,
    deadline: null,
    attachments: [],
    updatedAt,
    deletedAt: null,
  },
})

async function codeOf(run: Promise<unknown>): Promise<string | undefined> {
  try {
    await run
    return undefined
  } catch (err) {
    return err instanceof ORPCError ? err.code : String(err)
  }
}

const eventCount = async () =>
  (await getDB().select().from(projectEvents)).length

beforeAll(async () => {
  h = await startServer()
  owner = rpcClient(h)

  await auth.api.createUser({
    body: {
      name: "other",
      email: "other@deck.invalid",
      password: "other-password",
      data: { username: "other", displayUsername: "other" },
    },
    headers: new Headers({ cookie: h.cookie }),
  })
  const signIn = await auth.api.signInUsername({
    body: { username: "other", password: "other-password" },
    asResponse: true,
  })
  const cookie = signIn.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ")
  other = rpcClient({ app: h.app, cookie })
})

beforeEach(resetTables)

afterEach(() => {
  delete process.env.MISS_CLAUDE_URL
})

describe("projects", () => {
  test("creates a project with ordered workstreams", async () => {
    const project = await owner.projects.create({
      name: "Network",
      summary: "Starting out",
    })
    expect(project).toMatchObject({
      name: "Network",
      status: "active",
      version: 1,
    })
    expect(project.id).toMatch(/^proj-[0-9a-f]{12}$/)
    expect(project.summaryUpdatedAt).not.toBeNull()

    const routing = await owner.projects.workstreamCreate({
      projectId: project.id,
      name: "Routing",
      steps: [{ text: "Peer with upstream" }],
    })
    const dns = await owner.projects.workstreamCreate({
      projectId: project.id,
      name: "DNS",
      dependsOn: [routing.id],
    })
    expect(routing.steps).toEqual([
      {
        id: expect.stringMatching(/^step-/),
        text: "Peer with upstream",
        done: false,
      },
    ])

    const detail = await owner.projects.get({ id: project.id })
    expect(detail.workstreams.map((w) => w.name)).toEqual(["Routing", "DNS"])
    expect(detail.workstreams[1].dependsOn).toEqual([routing.id])
    expect(detail.events.map((e) => e.kind)).toEqual([
      "created",
      "created",
      "created",
    ])
    expect(detail.events[0].workstreamId).toBe(dns.id)
    expect(detail.events.every((e) => e.actor === "user")).toBe(true)

    const [summary] = await owner.projects.list()
    expect(summary).toMatchObject({
      id: project.id,
      workstreams: { total: 2, done: 0, blocked: 0, active: 0 },
      cards: { total: 0, done: 0 },
    })
  })

  test("linked cards from two boards follow their column's done flag", async () => {
    await owner.dashboards.sync({
      since: 0,
      changes: [board("b1"), board("b2")],
    })
    await owner.board.sync({
      boardId: "b1",
      since: 0,
      changes: [
        column("todo1", "b1"),
        column("done1", "b1", true),
        card("k1", "todo1"),
      ],
    })
    await owner.board.sync({
      boardId: "b2",
      since: 0,
      changes: [column("todo2", "b2"), card("k2", "todo2")],
    })

    const { id } = await owner.projects.create({ name: "P" })
    await owner.projects.cardLink({
      projectId: id,
      boardId: "b1",
      cardId: "k1",
    })
    await owner.projects.cardLink({
      projectId: id,
      boardId: "b2",
      cardId: "k2",
    })

    let { cards } = await owner.projects.get({ id })
    expect(cards).toEqual([
      expect.objectContaining({
        boardId: "b1",
        cardId: "k1",
        boardName: "Board b1",
        title: "Card k1",
        number: 1,
        done: false,
        deleted: false,
        accessible: true,
      }),
      expect.objectContaining({ boardId: "b2", cardId: "k2", done: false }),
    ])

    await owner.board.sync({
      boardId: "b1",
      since: 0,
      changes: [card("k1", "done1", now + 10_000)],
    })
    ;({ cards } = await owner.projects.get({ id }))
    expect(cards.map((c) => [c.cardId, c.done])).toEqual([
      ["k1", true],
      ["k2", false],
    ])
    const [summary] = await owner.projects.list()
    expect(summary.cards).toEqual({ total: 2, done: 1 })

    await owner.projects.cardUnlink({ projectId: id, cardId: "k2" })
    ;({ cards } = await owner.projects.get({ id }))
    expect(cards.map((c) => c.cardId)).toEqual(["k1"])
  })

  test("concurrent patches to different workstreams are both kept", async () => {
    const { id } = await owner.projects.create({ name: "P" })
    const a = await owner.projects.workstreamCreate({
      projectId: id,
      name: "A",
    })
    const b = await owner.projects.workstreamCreate({
      projectId: id,
      name: "B",
    })

    await Promise.all([
      owner.projects.workstreamUpdate({
        id: a.id,
        ifVersion: a.version,
        status: "active",
      }),
      owner.projects.workstreamUpdate({
        id: b.id,
        ifVersion: b.version,
        plan: "Plan B",
      }),
    ])

    const { workstreams } = await owner.projects.get({ id })
    expect(workstreams.find((w) => w.id === a.id)).toMatchObject({
      status: "active",
      plan: "",
      version: 2,
    })
    expect(workstreams.find((w) => w.id === b.id)).toMatchObject({
      status: "planned",
      plan: "Plan B",
      version: 2,
    })
  })

  test("a stale ifVersion is a CONFLICT carrying the current record, and writes nothing", async () => {
    const project = await owner.projects.create({ name: "P" })
    const updated = await owner.projects.update({
      id: project.id,
      ifVersion: 1,
      status: "blocked",
    })
    expect(updated.version).toBe(2)
    const events = await eventCount()

    let error: unknown
    try {
      await owner.projects.update({
        id: project.id,
        ifVersion: 1,
        status: "done",
        summary: "Overwritten",
      })
    } catch (err) {
      error = err
    }
    expect(error).toBeInstanceOf(ORPCError)
    expect((error as ORPCError<string, any>).code).toBe("CONFLICT")
    expect((error as ORPCError<string, any>).data.current).toMatchObject({
      version: 2,
      status: "blocked",
    })

    const { project: after } = await owner.projects.get({ id: project.id })
    expect(after).toMatchObject({ version: 2, status: "blocked", summary: "" })
    expect(await eventCount()).toBe(events)

    const ws = await owner.projects.workstreamCreate({
      projectId: project.id,
      name: "W",
    })
    await owner.projects.workstreamUpdate({ id: ws.id, note: "first" })
    expect(
      await codeOf(
        owner.projects.workstreamUpdate({
          id: ws.id,
          ifVersion: 1,
          note: "second",
        })
      )
    ).toBe("CONFLICT")
  })

  test("a plan change keeps the replaced plan, and why, in the event", async () => {
    const { id } = await owner.projects.create({ name: "P" })
    const ws = await owner.projects.workstreamCreate({
      projectId: id,
      name: "Routing",
      plan: "Use static routes",
    })
    await owner.projects.workstreamUpdate({
      id: ws.id,
      plan: "Use BGP",
      message: "upstream offers a session",
    })

    const { events, workstreams } = await owner.projects.get({ id })
    expect(workstreams[0].plan).toBe("Use BGP")
    expect(events[0]).toMatchObject({
      kind: "plan",
      workstreamId: ws.id,
      before: { plan: "Use static routes" },
    })
    expect(events[0].message).toContain("upstream offers a session")
  })

  test("session register upserts by worktree and carries an open URL only when configured", async () => {
    const { id } = await owner.projects.create({ name: "P" })
    const first = await owner.projects.sessionRegister({
      projectId: id,
      worktree: "/work/routing",
      mission: "routing",
      claudeSessionId: "s-1",
    })
    expect(first.label).toBe("routing")
    // Added by hand: a pointer to a session, not proof that it is alive.
    expect(first.lastActivityAt).toBeNull()

    const again = await owner.projects.sessionRegister({
      projectId: id,
      worktree: "/work/routing",
      claudeSessionId: "s-2",
      lastEvent: "start",
    })
    expect(again.id).toBe(first.id)
    expect(again).toMatchObject({ mission: "routing", claudeSessionId: "s-2" })
    expect(again.lastActivityAt).not.toBeNull()

    let { sessions } = await owner.projects.get({ id })
    expect(sessions).toHaveLength(1)
    expect(sessions[0].openUrl).toBeNull()

    process.env.MISS_CLAUDE_URL = "https://miss.invalid/"
    ;({ sessions } = await owner.projects.get({ id }))
    expect(sessions[0].openUrl).toBe(
      "https://miss.invalid/open?worktree=%2Fwork%2Frouting&session=s-2"
    )

    const [summary] = await owner.projects.list()
    expect(summary).toMatchObject({ sessionCount: 1, activeSessions: 1 })
  })

  test("another account cannot read or write someone else's project", async () => {
    await owner.dashboards.sync({ since: 0, changes: [board("b1")] })
    await owner.board.sync({
      boardId: "b1",
      since: 0,
      changes: [column("c1", "b1"), card("k1", "c1")],
    })
    const { id } = await owner.projects.create({ name: "Private" })

    expect(await other.projects.list()).toEqual([])
    expect(await codeOf(other.projects.get({ id }))).toBe("FORBIDDEN")
    expect(await codeOf(other.projects.update({ id, name: "Mine" }))).toBe(
      "FORBIDDEN"
    )
    expect(
      await codeOf(
        other.projects.cardLink({ projectId: id, boardId: "b1", cardId: "k1" })
      )
    ).toBe("FORBIDDEN")

    // Nor can they link a card from a board they cannot see into their own.
    const theirs = await other.projects.create({ name: "Theirs" })
    expect(
      await codeOf(
        other.projects.cardLink({
          projectId: theirs.id,
          boardId: "b1",
          cardId: "k1",
        })
      )
    ).toBe("FORBIDDEN")

    const { project } = await owner.projects.get({ id })
    expect(project.name).toBe("Private")
  })

  test("a linked card that moved to a board the viewer cannot see goes blank", async () => {
    await owner.dashboards.sync({ since: 0, changes: [board("b1")] })
    await owner.board.sync({
      boardId: "b1",
      since: 0,
      changes: [column("c1", "b1"), card("k1", "c1")],
    })
    const { id } = await owner.projects.create({ name: "P" })
    await owner.projects.cardLink({
      projectId: id,
      boardId: "b1",
      cardId: "k1",
    })

    await other.dashboards.sync({ since: 0, changes: [board("ob")] })
    await other.board.sync({
      boardId: "ob",
      since: 0,
      changes: [column("oc", "ob", true), card("k1", "oc", now + 10_000)],
    })

    const { cards } = await owner.projects.get({ id })
    expect(cards).toEqual([
      expect.objectContaining({
        boardId: "ob",
        cardId: "k1",
        title: "",
        boardName: "",
        number: null,
        done: false,
        accessible: false,
      }),
    ])
  })

  test("workstream references must belong to the same project", async () => {
    const a = await owner.projects.create({ name: "A" })
    const b = await owner.projects.create({ name: "B" })
    const wsB = await owner.projects.workstreamCreate({
      projectId: b.id,
      name: "B1",
    })
    expect(
      await codeOf(
        owner.projects.decisionCreate({
          projectId: a.id,
          workstreamId: wsB.id,
          kind: "blocker",
          title: "x",
        })
      )
    ).toBe("NOT_FOUND")
    expect(
      await codeOf(
        owner.projects.workstreamCreate({
          projectId: a.id,
          name: "A1",
          dependsOn: [wsB.id],
        })
      )
    ).toBe("NOT_FOUND")
  })

  test("a removed project leaves the list and reads as not found", async () => {
    const keep = await owner.projects.create({ name: "Keep" })
    const drop = await owner.projects.create({ name: "Drop" })

    expect(await owner.projects.remove({ id: drop.id })).toEqual({ ok: true })

    const list = await owner.projects.list()
    expect(list.map((p) => p.id)).toEqual([keep.id])
    expect(await codeOf(owner.projects.get({ id: drop.id }))).toBe("NOT_FOUND")
  })
})
