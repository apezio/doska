import { type Page } from "@playwright/test"

export function menu(page: Page, name: string) {
  return page.getByRole("menu", { name }).filter({ visible: true })
}
