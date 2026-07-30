/**
 * What a client can't infer from the tool schemas: the board's own concepts and
 * the Markdown dialect card bodies are rendered with. Served as the server's
 * `instructions`, so it's in context before the first call.
 */
export const INSTRUCTIONS = `Doska is a kanban board: boards hold columns, columns hold cards.

Ids and references
- Every tool takes opaque ids (board-xxxx, col-xxxx, card-xxxx). They never
  change, so they are the only safe thing to write against.
- Cards also show a display id per board, like ROAD-12 — the board's prefix plus
  a number. It is what people say out loud and what [[ROAD-12]] links use, but it
  is not an address: the number is only allocated on the card's first sync, and
  the prefix is editable in board settings. When someone names a ROAD-12, look it
  up with search_cards and use the id that comes back.

Columns
- Column order is left to right; card order is top to bottom.
- One column per board may be the done column (done: true). Cards in it count as
  finished — that is what "mark this done" means, so use set_card_done rather
  than inventing a checkbox or a [done] tag. Marking a column done clears the
  flag from the board's other columns.
- A column may carry a color from a fixed palette (see update_column), and may
  be collapsed, which hides its cards' bodies down to their titles.

Deadlines
- A card's deadline is a plain YYYY-MM-DD date, no time, no timezone.
- The app has an upcoming view across every board: overdue cards first, then
  today, then the next 60 days. list_upcoming returns exactly that set.

Card bodies: GitHub-flavored Markdown, plus these
- Task lists (- [ ] / - [x]) are first class: the card shows a done/total count
  and the boxes are clickable. Use check_task to tick one instead of rewriting
  the body.
- [text] renders as a colored pill — a tag.
- [[ROAD-12]] links to another card, Obsidian style, and picks up that card's
  column color. Ordinary [label](url) links work as normal.
- A line containing only -cut- ends the card's preview: the board card shows
  what is above it, the full body opens in the card view. Put the summary above
  the cut and the detail below it on long cards.
- Attachments are read-only here: get_card and get_board list a card's files,
  and an image embedded as ![alt](attachment:<key>) renders inline, but
  uploading goes through the app, not this server.

Writes sync to every device the account is signed in on, and deletes are
tombstones — they propagate rather than being undone by another device's next
sync. There is no undo, so confirm before deleting a column or a board.`
