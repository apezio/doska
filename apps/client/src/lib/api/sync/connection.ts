import { useSyncExternalStore } from "react"
import type { SyncFailure } from "@doska/sync"
import { runtime } from "@/lib/runtime"
import { isSyncConfigured, subscribeSyncConfig } from "../server"
import { sync } from "./sync-engine"

export type Connection =
  | { status: "ok" } // works
  | { status: "local" } // no sync server setup
  | { status: "dropped"; reason: SyncFailure } // connection is lost

const FAILURE_GRACE = 2

const OK: Connection = { status: "ok" }
const LOCAL: Connection = { status: "local" }

let connection: Connection = OK
let started = false
const listeners = new Set<() => void>()

function derive(): Connection {
  const { status, failures, failure } = sync.getState()

  if (!isSyncConfigured()) return LOCAL
  // Paused with nothing having gone wrong: signed out deliberately. An expired
  // session looks different — the 401 lands as an `auth` failure first.
  if (status === "paused" && failure === null) return LOCAL

  const offline = !runtime().net.online()
  // An expired session never recovers on its own, so it needs no grace period.
  const dropped = offline || failure === "auth" || failures >= FAILURE_GRACE
  if (!dropped) return OK

  return {
    status: "dropped",
    reason: offline ? "offline" : (failure ?? "server"),
  }
}

function same(a: Connection, b: Connection): boolean {
  if (a.status !== b.status) return false
  if (a.status !== "dropped" || b.status !== "dropped") return true
  return a.reason === b.reason
}

function recompute() {
  const next = derive()
  if (same(next, connection)) return
  connection = next
  for (const listener of listeners) listener()
}

/** Wires the store to its inputs, once per session. */
function start() {
  if (started) return
  started = true
  sync.subscribe(recompute)
  subscribeSyncConfig(recompute)
  runtime().net.subscribe(recompute)
  recompute()
}

function subscribe(listener: () => void): () => void {
  start()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Subscribe to the app's connection health. */
export function useConnection(): Connection {
  return useSyncExternalStore(subscribe, () => connection)
}
