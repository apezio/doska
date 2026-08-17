/**
 * Every route in `app/`, named once. The same file is addressed two ways:
 * `router` takes the path (`/board/prefix`), while `Stack.Screen` and
 * `Drawer.Screen` take the file name relative to their own layout
 * (`board/prefix`, or `index` for the drawer's own board screen).
 */
export const ROUTES = {
  board: "/",
  upcoming: "/upcoming",
  trash: "/trash",
  search: "/search",
  signIn: "/sign-in",
  boardActions: "/board/actions",
  boardPrefix: "/board/prefix",
  boardReorder: "/board/reorder",
  boardSort: "/board/sort",
  boardDelete: "/board/delete",
  // Reached from Upcoming, which spans boards, so the board is not the open one.
  boardDoneColumn: (id: string) => `/board/${id}/done-column` as const,
  columnNew: "/column/new",
  columnActions: (id: string) => `/column/${id}/actions` as const,
  columnDelete: (id: string) => `/column/${id}/delete` as const,
  card: (id: string) => `/card/${id}` as const,
  cardActions: (id: string) => `/card/${id}/actions` as const,
  cardDeadline: (id: string) => `/card/${id}/deadline` as const,
  cardPriority: (id: string) => `/card/${id}/priority` as const,
  cardMove: (id: string) => `/card/${id}/move` as const,
  cardDelete: (id: string) => `/card/${id}/delete` as const,
} as const

export const SCREENS = {
  drawer: "(drawer)",
  board: "index",
  upcoming: "upcoming",
  trash: "trash",
  search: "search",
  signIn: "sign-in",
  boardActions: "board/actions",
  boardPrefix: "board/prefix",
  boardReorder: "board/reorder",
  boardSort: "board/sort",
  boardDelete: "board/delete",
  boardDoneColumn: "board/[id]/done-column",
  columnNew: "column/new",
  columnActions: "column/[id]/actions",
  columnDelete: "column/[id]/delete",
  card: "card/[id]/index",
  cardActions: "card/[id]/actions",
  cardDeadline: "card/[id]/deadline",
  cardPriority: "card/[id]/priority",
  cardMove: "card/[id]/move",
  cardDelete: "card/[id]/delete",
} as const
