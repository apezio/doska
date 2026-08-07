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

if (import.meta.env.DEV) {
  createRoot(root).render(app)
} else {
  hydrateRoot(root, app)
}
