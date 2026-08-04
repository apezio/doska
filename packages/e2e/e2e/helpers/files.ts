import type { JSHandle, Locator, Page } from "@playwright/test"

/* -------------------------------------------------------------------------- */
/*  File helpers. Uploads need a backend, which the e2e server has no S3 for,  */
/*  so the storage routes are stubbed — the one place simulating the remote     */
/*  host is allowed.                                                           */
/* -------------------------------------------------------------------------- */

/** A 1×1 PNG, small enough to inline as base64. */
export const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC"

export const PNG = Buffer.from(PNG_BASE64, "base64")

/**
 * The real server 503s without S3 configured, so every attachment test mocks
 * the `/api/files` routes the client's `S3FileStorage` talks to. Must be
 * registered before the action that triggers the request.
 */
export async function mockFileRoutes(page: Page): Promise<void> {
  let uploads = 0
  await page.route("**/api/files", async (route) => {
    uploads += 1
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        key: `att/${uploads}.png`,
        mime: "image/png",
        size: PNG.length,
      }),
    })
  })
  await page.route("**/api/files/**", async (route) => {
    if (route.request().method() === "DELETE") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      })
      return
    }
    await route.fulfill({ status: 200, contentType: "image/png", body: PNG })
  })
}

interface FileTransfer {
  items: { add(file: unknown): void }
}

// The callbacks below are typechecked here but run in the page, where these
// globals exist; Node has no DOM lib. Type-only, so nothing is emitted.
declare const DataTransfer: { new (): FileTransfer }
declare const ClipboardEvent: {
  new (
    type: string,
    init: { clipboardData: unknown; bubbles: boolean; cancelable: boolean }
  ): Event
}

/**
 * A `DataTransfer` carrying one PNG, for driving drags and pastes — the only
 * way to hand the page a file without a file input, which is exactly what the
 * drop zone and the paste handler exist to serve.
 */
export function pngDataTransfer(
  page: Page,
  name: string
): Promise<JSHandle<FileTransfer>> {
  return page.evaluateHandle(
    ({ b64, fileName }) => {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
      const transfer = new DataTransfer()
      transfer.items.add(new File([bytes], fileName, { type: "image/png" }))
      return transfer
    },
    { b64: PNG_BASE64, fileName: name }
  )
}

/**
 * Pastes `transfer` into `target`. Playwright's `dispatchEvent` can't build a
 * ClipboardEvent, and a plain Event carries no `clipboardData` for the paste
 * handler to read — so the event is constructed in the page.
 */
export async function pasteInto(
  target: Locator,
  transfer: JSHandle<FileTransfer>
): Promise<void> {
  await target.evaluate((el, data) => {
    el.dispatchEvent(
      new ClipboardEvent("paste", {
        clipboardData: data,
        bubbles: true,
        cancelable: true,
      })
    )
  }, transfer)
}
