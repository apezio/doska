import { test, expect } from "@playwright/test"
import {
  authenticate,
  remoteCreateDashboard,
  remoteRenameDashboard,
  signIn,
} from "../helpers"

/**
 * The dashboard *list* syncs on its own board-independent channel, so a board
 * another client creates or renames shows up in an authorized session's sidebar
 * even though that session never opens it. The page is one client; the test
 * plays a second one straight against the backend, then asserts on what the
 * sidebar shows — never on ids or storage.
 *
 * This is the regression these tests guard: sync used to fetch only the open
 * board's data, leaving every other dashboard out of scope, so the list never
 * converged once signed in.
 */
test.describe("dashboard list sync", () => {
  test.beforeEach(async ({ page, request }) => {
    await signIn(page)
    await authenticate(request)
  })

  // Every project runs against the same backend and the same account, so the
  // sidebar also holds the boards the other projects' runs created — a fixed
  // name matches more than one of them.
  test("a board another client creates appears in the sidebar", async ({
    page,
    request,
    browserName,
  }) => {
    const name = `Teammate's roadmap (${browserName})`
    await remoteCreateDashboard(request, name)

    await expect(page.getByRole("button", { name })).toBeVisible()
  })

  test("a board another client renames updates in the sidebar", async ({
    page,
    request,
    browserName,
  }) => {
    const before = `Working title (${browserName})`
    const after = `Final title (${browserName})`
    const id = await remoteCreateDashboard(request, before)
    await expect(page.getByRole("button", { name: before })).toBeVisible()

    await remoteRenameDashboard(request, id, after)

    await expect(page.getByRole("button", { name: after })).toBeVisible()
    await expect(page.getByRole("button", { name: before })).toHaveCount(0)
  })
})
