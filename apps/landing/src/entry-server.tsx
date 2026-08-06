import { renderToString } from "react-dom/server"
import { App } from "./App"
import { docs } from "./docs/pages"

export function render(path: string) {
  return renderToString(<App path={path} />)
}

export const docPaths = docs.map((doc) => doc.path)

export function meta(path: string) {
  const doc = docs.find((page) => page.path === path)
  if (!doc) return null
  return { title: `${doc.title} | Doska`, description: doc.description }
}
