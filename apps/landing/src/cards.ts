import { app, repo } from "./links"

export const cards = {
  markdown: `GitHub-flavored Markdown:\\
**bold**, \`code\`, [links](${repo}), ==highlights==.\\
Task lists carry a live count (try clicking):

- [x] Written in Markdown
- [x] Rendered by the app
- [ ] Ticked from the board

Slash commands and suggestions, to make writing it bearable.`,

  attachments: `Drag a file into a card, or paste one. Inline images too:

![board-preview.png](attachment:board-preview)`,

  deadlines: `A due date gets a chip that shifts color as it nears.\\
This one has been overdue for a while.`,

  refs: `Type \`[[\` and pick a card. The reference carries its title and column,
both live, so a rename or a move updates every mention:

[[CARD-3]]`,

  search: `\`⌘\`+\`K\` searches the open board: card titles, bodies and the names
of files attached to them. Each hit brings the line it matched on, and Enter
opens the card.`,

  views: `Columns by default. One toggle in the header swaps the board for a
single list of rows, grouped by date.`,

  localFirst: `Boards live in the browser. Reads and writes hit your device, not
the network: fast, and offline.`,

  vault: `Point a board at a folder in the desktop app and it mirrors there: one
folder per column, one Markdown file per card. Edits go both ways, so a card
you write in your editor lands on the board, and deleted cards wait in
\`_trash\`.`,

  sync: `Point it at a server you run and boards reach every device, every couple
of seconds or on \`⌘\`+\`S\`.`,

  share: `The owner adds people from the accounts on your server, and takes them
off. A shared board syncs to everyone on it.`,

  publicLink: `Publish a board to a read-only link: no account, nothing kept in
the visitor's browser. Turn it off and the link is dead.`,

  accounts: `The admin adds accounts, sets passwords, deactivates. Nobody signs
themselves up.`,

  trash: `\`⌘\`+\`Z\` takes back the last delete; the rest waits in the trash, one
click from returning. Gone for good after 14 days.`,

  selfHost: `One script: it backs your data up, pulls the images, keeps your
config. There's a [self-hosting guide](${repo}#self-hosting).`,

  platforms: `[In the browser](${app}), as a PWA, or a macOS app that
auto-updates.`,

  phone: `Add it to your home screen: fullscreen and offline, like a real app.`,

  agents: `Boards over MCP, so Claude can read and edit them: create cards, tick
tasks, move things.`,
}

export const cardRefs: Record<
  string,
  { title: string; column: string; color: string }
> = {
  "CARD-3": { title: "Deadlines", column: "Cards", color: "violet" },
}
