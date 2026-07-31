import { flushSync } from "react-dom"
import type { Runtime } from "@doska/core"
import { webAuth } from "./web-auth"
import { webDb } from "./web-db"
import { webForeground } from "./web-foreground"
import { webHttp } from "./web-http"
import { webKeyValue } from "./web-kv"
import { webNet } from "./web-net"

/** The browser's ports — the same set in the Tauri webview, which is a browser. */
export const webRuntime: Runtime = {
  db: webDb,
  kv: webKeyValue,
  http: webHttp,
  auth: webAuth,
  net: webNet,
  foreground: webForeground,
  flushSync,
}

export { getServerUrl, setServerUrl } from "./server-url"
