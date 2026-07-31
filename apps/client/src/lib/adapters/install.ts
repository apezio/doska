// Side-effect module: installs the web ports. Import it first in the entry

import { installRuntime } from "@/lib/runtime"
import { webRuntime } from "./index"

installRuntime(webRuntime)
