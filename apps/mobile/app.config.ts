import { execSync } from "node:child_process"
import type { ConfigContext, ExpoConfig } from "expo/config"

// Same version stamp as the web client (apps/client/vite.config.ts): the git
// tag is baked in at build time, because there is no git at runtime.
function appVersion(): string {
  if (process.env.APP_VERSION) return process.env.APP_VERSION
  try {
    return execSync("git describe --tags --always", {
      encoding: "utf-8",
    }).trim()
  } catch {
    return "dev"
  }
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? "Doska",
  slug: config.slug ?? "doska",
  extra: { ...config.extra, appVersion: appVersion() },
})
