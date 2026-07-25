/**
 * Publishes the *visual* viewport height as `--app-height`.
 *
 * iOS never shrinks the layout viewport for the on-screen keyboard, so `svh`
 * and `100%` both leave the shell taller than the screen. iOS then lets the user
 * pan that overhang, and everything positioned against the layout viewport —
 * every `position: fixed` element, the full-screen card panel — slides with it.
 * Sizing the shell to what is actually visible leaves nothing to pan.
 *
 * Touch only: on desktop `visualViewport.height` also tracks pinch-zoom, where
 * shrinking the app is exactly wrong.
 */
export function trackAppHeight(): void {
  const viewport = window.visualViewport
  if (!viewport || !window.matchMedia("(pointer: coarse)").matches) return

  const apply = () =>
    document.documentElement.style.setProperty(
      "--app-height",
      `${viewport.height}px`
    )

  apply()
  viewport.addEventListener("resize", apply)
}
