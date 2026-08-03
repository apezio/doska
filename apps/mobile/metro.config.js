const path = require("node:path")
const { getDefaultConfig } = require("expo/metro-config")
const { withNativeWind } = require("nativewind/metro")

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, "../..")

const config = getDefaultConfig(projectRoot)

// The workspace packages are symlinked TS source, not built output, so Metro has
// to watch the whole repo and be told where pnpm's stores live. Hierarchical
// lookup stays on: under pnpm each package resolves its own deps by walking up
// from its real path, which is exactly what disabling it would break.
config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
]

module.exports = withNativeWind(config, { input: "./global.css" })
