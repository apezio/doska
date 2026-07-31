import type { Runtime } from "@/lib/runtime"
import { webAuth } from "./web-auth"
import { webHttp } from "./web-http"
import { webKeyValue } from "./web-kv"
import { webNet } from "./web-net"

/** The browser's ports — the same set in the Tauri webview, which is a browser. */
export const webRuntime: Runtime = {
  kv: webKeyValue,
  http: webHttp,
  auth: webAuth,
  net: webNet,
}

export { getServerUrl, setServerUrl } from "./server-url"
