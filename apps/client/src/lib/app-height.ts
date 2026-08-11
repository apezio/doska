/**
 * Publishes the visual viewport's height as `--app-height` and its offset from
 * the layout viewport as `--app-offset`.
 *
 * On iOS `height: 100%` resolves against the *large* viewport, so with the
 * keyboard up the document stays taller than the screen.
 *
 * Touch only: on desktop `visualViewport.height` also tracks pinch-zoom, where
 * shrinking the app is exactly wrong.
 */
export function trackAppHeight(): void {
  const viewport = window.visualViewport
  if (!viewport || !window.matchMedia("(pointer: coarse)").matches) return

  const apply = () => {
    const { style } = document.documentElement
    style.setProperty("--app-height", `${viewport.height}px`)
    style.setProperty("--app-offset", `${viewport.offsetTop}px`)
  }

  apply()
  viewport.addEventListener("resize", apply)
  viewport.addEventListener("scroll", apply)
}
