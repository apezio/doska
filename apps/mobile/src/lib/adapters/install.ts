// Side-effect module: installs the mobile ports. Import it first in the entry
// point — `@doska/core`'s sync facade is a module-scope singleton that reaches
// for the runtime as it is constructed, so the ports have to be in place before
// any module that touches core is evaluated.

// `uuid` reads `crypto.getRandomValues`, which React Native has no global for.
import "react-native-get-random-values"

import { installRuntime, type Runtime } from "@doska/core"
import { mobileAuth } from "./mobile-auth"
import { mobileDb } from "./mobile-db"
import { mobileForeground } from "./mobile-foreground"
import { mobileHttp } from "./mobile-http"
import { mobileKeyValue } from "./mobile-kv"
import { mobileNet } from "./mobile-net"

const mobileRuntime: Runtime = {
  db: mobileDb,
  kv: mobileKeyValue,
  http: mobileHttp,
  auth: mobileAuth,
  net: mobileNet,
  foreground: mobileForeground,
  // React Native has no `flushSync`; the port documents the fallback as running
  // the update as-is and taking a deferred commit.
  flushSync: (update) => update(),
}

installRuntime(mobileRuntime)
