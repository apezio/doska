import { beforeAll, beforeEach, describe, expect, test } from "vitest"
import { auth } from "../src/auth"
import {
  callTool,
  mcpToken,
  resetTables,
  startServer,
  toolJson,
  type Harness,
} from "./harness"

let h: Harness
let token: string
let otherToken: string

const call = (name: string, args?: Record<string, unknown>) =>
  callTool(h, token, name, args)
const json = async (name: string, args?: Record<string, unknown>) =>
  toolJson(await call(name, args))
const context = async (projectId: string) =>
  (await call("get_project_context", { project_id: projectId })).content[0].text

beforeAll(async () => {
  h = await startServer()
  await auth.api.createUser({
    body: {
      name: "other",
      email: "other-mcp@deck.invalid",
      password: "other-password",
      data: { username: "other-mcp", displayUsername: "other-mcp" },
    },
    headers: new Headers({ cookie: h.cookie }),
  })
  const signIn = await auth.api.signInUsername({
    body: { username: "other-mcp", password: "other-password" },
    asResponse: true,
  })
  const otherCookie = signIn.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ")
  token = await mcpToken(h, h.cookie)
  otherToken = await mcpToken(h, otherCookie)
})

beforeEach(resetTables)

async function seed() {
  const project = await json("create_project", {
    name: "Mission Control",
    summary: "Building the projects view",
  })
  const api = await json("create_workstream", {
    project_id: project.id,
    name: "API",
    steps: [{ text: "Schema" }, { text: "Router" }],
  })
  const ui = await json("create_workstream", {
    project_id: project.id,
    name: "UI",
    depends_on: [api.id],
    steps: [{ text: "List page" }],
  })
  return { project, api, ui }
}

describe("projects over MCP", () => {
  test("session_start finds the projects a worktree registered on", async () => {
    const { project } = await seed()

    expect(
      toolJson(await call("session_start", { worktree: "/w/unknown" }))
    ).toMatchObject({ projects: [] })

    const session = await json("register_session", {
      project_id: project.id,
      worktree: "/w/noble-island",
      mission: "noble-island",
    })
    const started = await json("session_start", {
      worktree: "/w/noble-island",
      claude_session_id: "abc",
    })

    expect(started.projects).toHaveLength(1)
    expect(started.projects[0]).toMatchObject({
      id: project.id,
      name: "Mission Control",
      session_id: session.id,
    })
    const brief: string = started.projects[0].context
    expect(brief).toContain("Project: Mission Control [active]")
    expect(brief).toContain(
      "- API [planned, plan proposed] next: Schema (0/2 steps)"
    )
    expect(brief).toContain("- UI [planned, plan proposed] next: List page")
    expect(brief).toContain("after: API")
    expect(brief).toContain("noble-island — noble-island — last just now")
  })

  test("session_start with project_id joins a project it isn't on yet", async () => {
    const { project } = await seed()
    const started = await json("session_start", {
      worktree: "/w/fresh",
      mission: "fresh-mission",
      project_id: project.id,
    })
    expect(started.projects).toHaveLength(1)
    expect(started.projects[0].context).toContain("fresh-mission")
  })

  test("two sessions updating different workstreams both land", async () => {
    const { project, api, ui } = await seed()
    const one = await json("register_session", {
      project_id: project.id,
      worktree: "/w/one",
    })
    const two = await json("register_session", {
      project_id: project.id,
      worktree: "/w/two",
    })

    await json("update_workstream", {
      workstream_id: api.id,
      if_version: api.version,
      status: "active",
      session_id: one.id,
    })
    await json("update_workstream", {
      workstream_id: ui.id,
      if_version: ui.version,
      note: "waiting on API",
      session_id: two.id,
    })
    await json("set_step", {
      workstream_id: api.id,
      text: "Schema",
      done: true,
      session_id: one.id,
    })
    const brief = (
      await call("record_progress", {
        project_id: project.id,
        session_id: two.id,
        workstream_id: ui.id,
        message: "Drafted the list page",
        steps_done: ["List page"],
        summary: "API underway, UI drafted",
      })
    ).content[0].text

    expect(brief).toContain("Summary: API underway, UI drafted")
    expect(brief).toContain(
      "- API [active, plan proposed] next: Router (1/2 steps)"
    )
    expect(brief).toContain("- UI [planned, plan proposed] (1/1 steps)")
    expect(brief).toContain("note: waiting on API")
    expect(brief).toContain("Last update: just now")

    const detail = await json("get_project", { project_id: project.id })
    const sessionTwo = detail.sessions.find((s: any) => s.id === two.id)
    expect(sessionTwo.lastEvent).toBe("progress")
    expect(
      detail.events.some(
        (e: any) =>
          e.message === "Drafted the list page" &&
          e.sessionId === two.id &&
          e.actor === "mcp"
      )
    ).toBe(true)
  })

  test("a stale if_version is refused with the current version", async () => {
    const { api } = await seed()
    await json("update_workstream", {
      workstream_id: api.id,
      if_version: api.version,
      status: "active",
    })

    const stale = await call("update_workstream", {
      workstream_id: api.id,
      if_version: api.version,
      status: "blocked",
    })

    expect(stale.isError).toBe(true)
    expect(stale.content[0].text).toContain(`version ${api.version + 1}`)
    expect(stale.content[0].text).toContain('"status":"active"')
  })

  test("an open decision shows under Needs attention until resolved", async () => {
    const { project, api } = await seed()
    expect(await context(project.id)).toContain("Needs attention: nothing open")

    const decision = await json("add_decision", {
      project_id: project.id,
      workstream_id: api.id,
      kind: "decision",
      title: "REST or RPC?",
    })
    const brief = await context(project.id)
    expect(brief).toContain("Needs attention:\n")
    expect(brief).toContain(`- Decision: REST or RPC? (API) [${decision.id}]`)

    await json("resolve_decision", {
      decision_id: decision.id,
      resolution: "RPC",
    })
    expect(await context(project.id)).toContain("Needs attention: nothing open")
  })

  test("a session's answered decision leads its next brief, once", async () => {
    const { project } = await seed()
    const [session] = (
      await json("session_start", {
        worktree: "/w/answers",
        project_id: project.id,
      })
    ).projects
    const decision = await json("add_decision", {
      project_id: project.id,
      kind: "decision",
      title: "REST or RPC?",
      session_id: session.session_id,
    })
    // Answered strictly after the session last spoke, not in the same ms.
    await new Promise((r) => setTimeout(r, 5))
    await json("resolve_decision", {
      decision_id: decision.id,
      resolution: "RPC\nfewer moving parts",
    })

    const progress = (sessionId?: string) =>
      call("record_progress", {
        project_id: project.id,
        session_id: sessionId,
        message: "checkpoint",
      }).then((r) => r.content[0].text)

    expect(await progress()).not.toContain("operator answered")
    expect(await progress(session.session_id)).toContain(
      "Since your last call, the operator answered:\n" +
        `- Decision: REST or RPC? [${decision.id}] → RPC fewer moving parts`
    )
    expect(await progress(session.session_id)).not.toContain(
      "operator answered"
    )
  })

  test("another user's token cannot read the project", async () => {
    const { project } = await seed()
    const result = await callTool(h, otherToken, "get_project", {
      project_id: project.id,
    })
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain(project.id)
  })

  test("a linked card shows in the brief with its done state", async () => {
    const { project } = await seed()
    const created = await json("create_board", { title: "Roadmap" })
    const card = await json("create_card", {
      boardId: created.board.id,
      columnId: created.columns[0].id,
      title: "Ship projects",
    })

    await json("link_card", {
      project_id: project.id,
      board_id: created.board.id,
      card_id: card.id,
    })

    expect(await context(project.id)).toMatch(
      /- #\d+ Ship projects \(Roadmap\) ○/
    )
  })
})
