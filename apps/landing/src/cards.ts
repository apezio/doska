import { app, repo, roadmap } from "./links"

/**
 * The page's copy, written the way a real card body is written — the same
 * markdown the app parses, rendered through the app's own renderer. Nothing
 * here is markup: if a construct renders wrong on the landing page, it renders
 * wrong in the app.
 */
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

  localFirst: `Boards live in the browser. Reads and writes hit your device, not
the network: fast, and offline.`,

  sync: `Point it at a server you run and boards reach every device, every couple
of seconds or on \`⌘\`+\`S\`.`,

  share: `The owner adds people from the accounts on your server, and takes them
off. A shared board syncs to everyone on it.`,

  publicLink: `Publish a board to a read-only link: no account, nothing kept in
the visitor's browser. Turn it off and the link is dead.\\
[This project's roadmap](${roadmap}) is one of them.`,

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

/** What the demo's `[[CARD-3]]` resolves to — the app reads this off the card. */
export const cardRefs: Record<
  string,
  { title: string; column: string; color: string }
> = {
  "CARD-3": { title: "Deadlines", column: "Cards", color: "violet" },
}
