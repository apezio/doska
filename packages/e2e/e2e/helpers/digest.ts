import type { Page } from "@playwright/test"

/* -------------------------------------------------------------------------- */
/*  Digest helpers. The digest and a board's row view render the same rows.    */
/* -------------------------------------------------------------------------- */

/**
 * One row in the digest, located by its card's title. A row is a board card
 * like any other now, so it is the list item that holds the whole thing — the
 * card, its tick box and the board it came from — and not a single button.
 * Matched on the title element alone, so a card quoting another card's title in
 * its body doesn't match that card's row.
 */
export function digestRow(page: Page, title: string) {
  return page.locator("li").filter({
    has: page.locator('[data-slot="card-title"]', { hasText: title }),
  })
}
