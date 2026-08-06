import { StrictMode } from "react"
import { createRoot, hydrateRoot } from "react-dom/client"
import { App } from "./App"
import "./index.css"

const root = document.getElementById("root")!
const app = (
  <StrictMode>
    <App path={window.location.pathname} />
  </StrictMode>
)

// Only the build prerenders markup into the shell. Dev serves the template with
// its placeholder comment still in it, so there is nothing there to hydrate.
if (import.meta.env.DEV) {
  createRoot(root).render(app)
} else {
  hydrateRoot(root, app)
}
