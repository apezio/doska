import { app, repo } from "./links"

/**
 * The page's copy, written the way a real card body is written — the same
 * markdown the app parses, rendered through the app's own renderer. Nothing
 * here is markup: if a construct renders wrong on the landing page, it renders
 * wrong in the app.
 */
export const cards = {
  markdown: `GitHub-flavored Markdown:\\
**bold**, \`code\`, [links](${repo}), ==highlights==.\\
Task lists carry a live count, up in the header (try clicking):

- [x] Written in Markdown
- [x] Rendered by the app's own renderer
- [ ] Ticked from the board

I tried to make Markdown editing more bearable: slash commands, suggestions.`,

  attachments: `File attachments, inline images, support for dragging files
into a card or pasting from the buffer:

![board-preview.png](attachment:board-preview)

Bracketed words become colored pills: [design] [needs review]`,

  deadlines: `Set a due date and the chip shifts color as it nears.\\
Like this one, which has been overdue for a while.`,

  refs: `Type \`[[\` and pick a card. The reference (wikilink) carries its title
and the column it's in: both read live, so a rename or a move updates every
mention:

[[CARD-3]]`,

  localFirst: `Boards live in the browser. Reads and writes hit your device, not
the network, so it's fast, and it works offline.`,

  sync: `Point it at a server you run and boards replicate to every device in
the background. Sync happens every couple of seconds, or on \`⌘\`+\`S\`.`,

  trash: `\`⌘\`+\`Z\` takes back the last delete. Everything else waits in the
trash, where one click puts it back: a column returns with its cards, a board
with its columns.

After 14 days it's permanently deleted, on your device and on your server.`,

  selfHost: `Comes with an install script.\\
The script backs up your data, and bundles all you need to run the app. Re-run
any time to pull newer images. It keeps your config. There's a
[self-hosting guide](${repo}#self-hosting).`,

  platforms: `[In the browser](${app}), installed as a PWA, or a Tauri macOS app
that reuses the same client and auto-updates.`,

  phone: `Add it to your home screen and it runs fullscreen and offline, like a
real app.`,

  agents: `The server exposes your boards over MCP, so Claude or other agents
can read and edit them: create cards, tick task lists, move things.`,
}

/** What the demo's `[[CARD-3]]` resolves to — the app reads this off the card. */
export const cardRefs: Record<
  string,
  { title: string; column: string; color: string }
> = {
  "CARD-3": { title: "Deadlines", column: "Cards", color: "violet" },
}
