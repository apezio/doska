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

// Distinct bundle id so a dev build installs alongside the TestFlight app
// instead of replacing it. Consequence: separate keychain and SQLite, so the
// dev build starts logged out.
const isDev = process.env.APP_VARIANT === "dev"

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: isDev ? "Doska Dev" : (config.name ?? "Doska"),
  slug: config.slug ?? "doska",
  scheme: isDev ? "doska-dev" : config.scheme,
  icon: isDev ? "./assets/icon-dev.png" : config.icon,
  ios: {
    ...config.ios,
    bundleIdentifier: isDev ? "com.doska.app.dev" : "com.doska.app",
  },
  android: {
    ...config.android,
    package: isDev ? "com.doska.app.dev" : "com.doska.app",
    adaptiveIcon: {
      ...config.android?.adaptiveIcon,
      foregroundImage: isDev
        ? "./assets/adaptive-icon-dev.png"
        : "./assets/adaptive-icon.png",
    },
  },
  extra: { ...config.extra, appVersion: appVersion() },
})
