import "@/lib/adapters/install" // must stay first
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClientProvider } from "@tanstack/react-query"
import { LoginPromptProvider } from "@/components/login/login-prompt"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { isDesktop } from "@/lib/platform"
import { onSessionExpired } from "@doska/core/auth"
import { seed } from "@doska/core/db"
import { purgeExpired } from "@doska/core/operations"
import { keys } from "@doska/core/keys"
import { trackAppHeight } from "@/lib/app-height"
import { blockEdgeSwipeNavigation } from "@/lib/edge-swipe"
import { initZoom } from "@/lib/zoom"
import { requestPersistentStorage } from "@/lib/persist"
import { queryClient } from "@doska/core/query-client"
import { Router } from "./router.tsx"
import { seedClock, startBackgroundSync } from "@doska/core/sync"
import { UpdateBanner } from "@/components/updates/update-banner"
import { ConnectionBanner } from "@/components/sync/connection-banner"
import { WindowDragRegion } from "@/components/window-drag-region"
import "./index.css"

onSessionExpired(() => {
  queryClient.setQueryData(keys.session, { authed: false, login: null })
})

// Restore the HLC high-water mark first: `startBackgroundSync` reconciles once
// before it returns, so anything below it is already too late.
await seedClock()

startBackgroundSync(Number(import.meta.env.VITE_SYNC_INTERVAL_MS))

trackAppHeight()

blockEdgeSwipeNavigation()

initZoom()

// Not awaited: the answer only affects eviction policy, never this render.
if (!isDesktop()) void requestPersistentStorage()

// Seed the local DB from fixtures on first run
await seed()

// Empty the trash of anything past its 14 days. Not awaited: nothing rendered
// reads tombstones, and the trash view sweeps again when it opens.
void purgeExpired()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LoginPromptProvider>
          <Router />
          <UpdateBanner />
          <ConnectionBanner />
          <WindowDragRegion />
        </LoginPromptProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
)
