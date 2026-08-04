import { test, expect } from "@playwright/test"
import { authenticate, createBoard, dashboardSync, signIn } from "../helpers"

/**
 * A board created in the UI reaches the server. Everything else in this
 * directory asserts the pull direction — the page reconciling a second client's
 * write — which needs the short VITE_SYNC_INTERVAL_MS the e2e bundle is built
 * with. Push is asserted by polling the server, so this one also runs against a
 * container stack serving the 10s production cadence.
 */
test.describe("sync push", { tag: "@container" }, () => {
  test("a board created here reaches the server", async ({ page, request }) => {
    await signIn(page)
    await authenticate(request)

    const boardId = await createBoard(page)

    // Generous, because the client may only push on its next interval tick and
    // that interval differs between the e2e bundle and the shipped image.
    await expect
      .poll(
        async () => {
          const { changes } = await dashboardSync(request, {
            since: 0,
            changes: [],
          })
          return changes.some((c) => c.record.id === boardId)
        },
        {
          timeout: 30_000,
          message: `board ${boardId} never reached the server`,
        }
      )
      .toBe(true)
  })
})
