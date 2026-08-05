import "@/lib/adapters/install" // must stay first
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClientProvider } from "@tanstack/react-query"
import { LoginPromptProvider } from "@/components/login/login-prompt"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { isDesktop } from "@/lib/platform"
import { bootstrapClient } from "@doska/core/bootstrap"
import { trackAppHeight } from "@/lib/app-height"
import { blockEdgeSwipeNavigation } from "@/lib/edge-swipe"
import { initExternalLinks } from "@/lib/external-links"
import { initZoom } from "@/lib/zoom"
import { requestPersistentStorage } from "@/lib/persist"
import { queryClient } from "@doska/core/query-client"
import { Router } from "./router.tsx"
import { UpdateBanner } from "@/components/updates/update-banner"
import { ConnectionBanner } from "@/components/sync/connection-banner"
import { WindowDragRegion } from "@/components/window-drag-region"
import "./index.css"

await bootstrapClient(Number(import.meta.env.VITE_SYNC_INTERVAL_MS))

trackAppHeight()

blockEdgeSwipeNavigation()

initZoom()

initExternalLinks()

// Not awaited: the answer only affects eviction policy, never this render.
if (!isDesktop()) void requestPersistentStorage()

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
