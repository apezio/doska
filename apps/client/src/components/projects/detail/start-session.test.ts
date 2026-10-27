import { describe, expect, it, vi } from "vitest"
import { startSession } from "./start-session"

const reply = (status: number, body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status }))

describe("startSession", () => {
  it("posts the project to the dashboard and reports the started name", async () => {
    const fetchFn = reply(200, { ok: true, name: "doska", started: true })
    const result = await startSession("https://jump:4200", "proj-1", fetchFn)

    expect(result).toEqual({ kind: "ok", name: "doska" })
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe("https://jump:4200/doska/start")
    expect(init.method).toBe("POST")
    expect(init.credentials).toBe("include")
    expect(String(init.body)).toBe("doska_project=proj-1")
  })

  it("asks for a login when the dashboard says so", async () => {
    const fetchFn = reply(401, { ok: false, login: true, msg: "Log in" })
    expect(await startSession("https://d", "p", fetchFn)).toEqual({
      kind: "login",
      msg: "Log in",
    })
  })

  it("passes other refusals through as errors", async () => {
    const fetchFn = reply(500, { ok: false, msg: "tmux is wedged" })
    expect(await startSession("https://d", "p", fetchFn)).toEqual({
      kind: "error",
      msg: "tmux is wedged",
    })
  })

  it("treats a body without a message, or not JSON, as an error", async () => {
    const fetchFn = vi.fn(async () => new Response("<html>", { status: 404 }))
    expect(await startSession("https://d", "p", fetchFn)).toEqual({
      kind: "error",
      msg: "The dashboard answered 404.",
    })
  })

  it("treats a network or CORS failure as an error", async () => {
    const fetchFn = vi.fn(async () => {
      throw new TypeError("Failed to fetch")
    })
    expect(await startSession("https://d", "p", fetchFn)).toEqual({
      kind: "error",
      msg: "Couldn't reach the dashboard.",
    })
  })
})
