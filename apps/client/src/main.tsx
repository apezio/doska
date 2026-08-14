import "@/lib/adapters/install" // must stay first
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClientProvider } from "@tanstack/react-query"
import { MotionConfig } from "motion/react"
import { LoginPromptProvider } from "@/providers/login-prompt/login-prompt-provider"
import { ThemeProvider } from "@/providers/theme/theme-provider"
import { isDesktop } from "@/lib/platform"
import { bootstrapClient } from "@doska/core/bootstrap"
import { trackAppHeight } from "@/lib/app-height"
import { blockEdgeSwipeNavigation } from "@/lib/edge-swipe"
import { initExternalLinks } from "@/lib/external-links"
import { initZoom } from "@/lib/zoom"
import { requestPersistentStorage } from "@/lib/persist"
import { queryClient } from "@doska/core/query-client"
import { routes } from "@/lib/routes"
import { Router } from "./router.tsx"
import { ErrorBoundary } from "@/components/error-boundary"
import { PublicRouter } from "@/components/public/public-router"
import { UpdateBanner } from "@/components/updates/update-banner"
import { ConnectionBanner } from "@/components/sync/connection-banner"
import { WindowDragRegion } from "@/components/window-drag-region"
import "./index.css"

const root = createRoot(document.getElementById("root")!)

// A share link is a different application on the same bundle: its visitor has
// no account, so seeding a local database and starting a sync loop for them
// would be writing to a browser that never asked for any of it.
const isPublicLink = routes.public.matches(window.location.pathname)

trackAppHeight()

if (isPublicLink) {
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <PublicRouter />
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>
  )
} else {
  await bootstrapClient(Number(import.meta.env.VITE_SYNC_INTERVAL_MS))

  blockEdgeSwipeNavigation()

  initZoom()

  initExternalLinks()

  // Not awaited: the answer only affects eviction policy, never this render.
  if (!isDesktop()) void requestPersistentStorage()

  root.render(
    <StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <LoginPromptProvider>
              <MotionConfig reducedMotion="user">
                <Router />
              </MotionConfig>
              <UpdateBanner />
              <ConnectionBanner />
              <WindowDragRegion />
            </LoginPromptProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>
  )
}
