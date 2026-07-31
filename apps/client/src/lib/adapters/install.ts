// Side-effect module: installs the web ports. Import it first in the entry
// point — `@doska/core`'s sync facade is a module-scope singleton that reaches
// for the runtime as it is constructed, so the ports have to be in place before
// any module that touches core is evaluated, not merely before `main` runs.

import { installRuntime } from "@doska/core"
import { webRuntime } from "./index"

installRuntime(webRuntime)
