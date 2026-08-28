---
title: Documentation
nav: Overview
description: "Doska is a local-first Kanban board with first-class Markdown support."
order: 1
updated: "2026-08-27"
---

Doska is a Kanban board where the cards are Markdown. It runs in your browser
and keeps the boards there, so it's fast, needs no account, and works offline.
Point it at a server you run and that server holds the canonical
copy, replicated to every device you sign in from.

## Two ways to run it

### Local only
Open [app.doska.sh](https://app.doska.sh/d/welcome) and start.
Nothing is sent anywhere; the boards live in your browser's IndexedDB.

### With a server
Run the selfhosted sync server. Boards
replicate across your devices in the background, the desktop app can point at
it, and agents can reach it over MCP.

> Browser storage isn't permanent. The app asks the browser not to evict it, but
> that's best-effort: the browser can still clear it, and "clear site data"
> always will. Treat local-only as a working copy. If the boards matter, run a
> server and let it keep the durable one.

## What a card is

A card body is GitHub-flavored Markdown, edited in place, with a few additions to the syntax:

- `- [ ]` task lists are first class,  the card header carries a live done/total
  count and the boxes are clickable.
- `[[CARD-12]]` links to another card and picks up its column's color.
- A line containing only `-cut-` ends the card's preview: the board shows what's
  above it, the full body opens in the card view.

Cards take deadlines (a plain `YYYY-MM-DD` date) and file attachments, and an
**Upcoming** view gathers cards from every board by deadline,  overdue first,
then grouped by day.

A card also carries a priority: a number from 0 to 100, higher is more
important, 0 for none. Click it in the card's title row and type a new one.

## Organizing boards

The sidebar holds the boards as a tree. Drag a row between rows to reorder it,
or onto a row to nest it underneath; nesting is only how the list is arranged,
the board's own columns and cards don't change.

Drop a card onto a board in the sidebar and it moves there, to the top of that
board's first column.

The sidebar's **Cards** tab lists the open cards across every board,  the first
two columns of each, in priority order. It shows the ten most important and
counts the rest; clicking one opens it on its board.

On a board, drag a column's right edge to resize it. The width is remembered on
that device.

## Where to go next

- [Self-hosting](/docs/self-hosting),  one-line installer, HTTPS, backups.
- [Accounts](/docs/accounts),  more than one person on your server.
- [MCP](/docs/mcp),  let an agent read and edit your boards.
- [Desktop and mobile](/docs/desktop),  the macOS app and the PWA.
- [Development](/docs/development),  run the monorepo locally.
