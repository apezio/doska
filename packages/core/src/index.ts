/**
 * The domain and data layers, with no platform underneath them. What is left of
 * a host app is the view and the adapters: hand `installRuntime` one
 * implementation of each port and everything else here works unchanged.
 */

export { installRuntime, runtime } from "./runtime"
export type { Runtime } from "./runtime"
