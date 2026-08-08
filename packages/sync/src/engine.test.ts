import { beforeEach, describe, expect, it, vi } from "vitest"
import type { KeyValue } from "@doska/ports"
import { DirtyStore } from "./dirty"
import type { PushInput, PushResult, SyncDriver } from "./driver"
import { SyncEngine } from "./engine"

/** A change is just the ref it occupies; enough to drive the engine. */
type Change = { ref: string }

/** Refs are `scope/id`, so a ref's scope is readable without a store. */
class FakeDriver implements SyncDriver<string, Change> {
  readonly pushes: PushInput<string, Change>[] = []

  push: (input: PushInput<string, Change>) => Promise<PushResult<Change>> = (
    input
  ) => {
    this.pushes.push(input)
    return Promise.resolve({ cursor: 1, changes: [] })
  }

  get pushedScopes(): string[] {
    return this.pushes.map((p) => p.scope)
  }

  record(input: PushInput<string, Change>) {
    this.pushes.push(input)
  }

  loadCursor = () => Promise.resolve(0)
  saveCursor = () => Promise.resolve()

  collectChanges(scope: string, dirty: DirtyStore) {
    const refs = [...dirty.all()].filter((ref) => ref.startsWith(`${scope}/`))
    return Promise.resolve({ changes: refs.map((ref) => ({ ref })), refs })
  }

  pendingScopes(dirty: DirtyStore) {
    const scopes = new Set<string>()
    for (const ref of dirty.all()) scopes.add(ref.split("/")[0])
    return Promise.resolve([...scopes])
  }

  applyRemote = () => Promise.resolve()
  refOf = (change: Change) => change.ref
  compact = () => Promise.resolve()
}

/** A promise that never settles — a fetch killed when the OS suspends the app. */
const forever = <T>(): Promise<T> => new Promise<T>(() => {})

let keySeq = 0
const freshKey = () => `test:dirty:${keySeq++}`

/** The persistence a reload survives, without a browser under it. */
const stored = new Map<string, string>()

const kv: KeyValue = {
  get: (key) => stored.get(key) ?? null,
  set: (key, value) => void stored.set(key, value),
  remove: (key) => void stored.delete(key),
}

beforeEach(() => stored.clear())

describe("SyncEngine", () => {
  it("pushes an active scope's dirty refs and clears them on success", async () => {
    const driver = new FakeDriver()
    const engine = new SyncEngine(driver, { kv, storageKey: freshKey() })

    engine.setActiveScope("b1")
    engine.mark("b1/c1")
    await engine.reconcile()

    // Across all pushes, not the last: `setActiveScope` starts a cycle, so the
    // mark rides the first pass and the rerun pushes nothing.
    expect(driver.pushes.flatMap((p) => p.changes)).toEqual([{ ref: "b1/c1" }])
    expect(engine.getState().pending).toBe(0)
  })

  it("forgets dirty refs on clearDirty, in memory and on disk", async () => {
    const driver = new FakeDriver()
    const key = freshKey()
    const engine = new SyncEngine(driver, { kv, storageKey: key })

    engine.mark("b1/c1")
    engine.clearDirty()

    expect(engine.getState().pending).toBe(0)
    expect([...new DirtyStore(kv, key).all()]).toEqual([])

    // Nothing left to find a scope from, so the reconcile pushes nothing.
    await engine.reconcile()
    expect(driver.pushes).toEqual([])
  })

  it("syncs nothing after a reset until it is pointed somewhere again", async () => {
    const driver = new FakeDriver()
    const engine = new SyncEngine(driver, { kv, storageKey: freshKey() })

    engine.setActiveScope("b1")
    engine.watchScopes(["b2"])
    engine.mark("b1/c1")
    await engine.reconcileScopes(["b3"])
    driver.pushes.length = 0

    engine.reset()
    await engine.reconcile()
    expect(driver.pushes).toEqual([])

    engine.setActiveScope("b9")
    await engine.reconcile()
    expect([...new Set(driver.pushedScopes)]).toEqual(["b9"])
  })

  it("restores dirty refs when the push rejects", async () => {
    const driver = new FakeDriver()
    const key = freshKey()
    const engine = new SyncEngine(driver, { kv, storageKey: key })
    driver.push = () => Promise.reject(new Error("boom"))

    engine.setActiveScope("b1")
    engine.mark("b1/c1")
    await engine.reconcile()

    expect(engine.getState().status).toBe("error")
    expect([...new DirtyStore(kv, key).all()]).toEqual(["b1/c1"])
  })

  it("keeps dirty refs recoverable when the push never settles", async () => {
    const driver = new FakeDriver()
    const key = freshKey()
    const engine = new SyncEngine(driver, { kv, storageKey: key })
    driver.push = (input) => {
      driver.record(input)
      return forever()
    }

    engine.setActiveScope("b1")
    engine.mark("b1/c1")
    void engine.reconcile()
    await vi.waitUntil(() => driver.pushes.length > 0)

    // The process dies here. What a relaunch would read back:
    expect([...new DirtyStore(kv, key).all()]).toEqual(["b1/c1"])
  })

  it("keeps a ref marked again while its push was in flight", async () => {
    const driver = new FakeDriver()
    const engine = new SyncEngine(driver, { kv, storageKey: freshKey() })
    let release: (result: PushResult<Change>) => void = () => {}
    driver.push = (input) => {
      driver.record(input)
      return new Promise((resolve) => (release = resolve))
    }

    // No active scope: `pendingScopes` alone drives the cycle, so there is one
    // pass and the re-mark isn't swept up by a rerun.
    engine.mark("b1/c1")
    const done = engine.reconcile()
    await vi.waitUntil(() => driver.pushes.length > 0)

    engine.mark("b1/c1")
    release({ cursor: 1, changes: [] })
    await done

    expect(engine.getState().pending).toBe(1)
  })

  it("does not consume one-shot scopes while syncing is gated off", async () => {
    const driver = new FakeDriver()
    let allowed = false
    const engine = new SyncEngine(driver, {
      kv,
      storageKey: freshKey(),
      canSync: () => allowed,
    })

    await engine.reconcileScopes(["b1"])
    expect(driver.pushedScopes).toEqual([])
    expect(engine.getState().status).toBe("paused")

    allowed = true
    await engine.reconcile()

    expect(driver.pushedScopes).toEqual(["b1"])
  })

  it("consumes one-shot scopes once they have actually been pulled", async () => {
    const driver = new FakeDriver()
    const engine = new SyncEngine(driver, { kv, storageKey: freshKey() })

    await engine.reconcileScopes(["b1"])
    await engine.reconcile()

    expect(driver.pushedScopes).toEqual(["b1"])
  })

  it("pulls watched scopes on every pass until they are cleared", async () => {
    const driver = new FakeDriver()
    const engine = new SyncEngine(driver, { kv, storageKey: freshKey() })

    engine.watchScopes(["b1", "b2"])
    await engine.reconcile()
    await engine.reconcile()

    expect(driver.pushedScopes).toEqual(["b1", "b2", "b1", "b2"])

    engine.watchScopes([])
    await engine.reconcile()

    expect(driver.pushedScopes).toEqual(["b1", "b2", "b1", "b2"])
  })
})
