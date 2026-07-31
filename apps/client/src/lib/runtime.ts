import type { Auth, Http, KeyValue, Net } from "@doska/ports"

/**
 * The platform's implementations of the ports, singleton
 */
export interface Runtime {
  kv: KeyValue
  http: Http
  auth: Auth
  net: Net
}

let installed: Runtime | null = null

export function installRuntime(next: Runtime): void {
  installed = next
}

export function runtime(): Runtime {
  if (!installed) throw new Error("runtime used before installRuntime()")
  return installed
}
