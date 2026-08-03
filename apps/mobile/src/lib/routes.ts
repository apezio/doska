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
  signIn: "/sign-in",
  boardActions: "/board/actions",
  boardPrefix: "/board/prefix",
  boardReorder: "/board/reorder",
  boardDelete: "/board/delete",
  card: (id: string) => `/card/${id}` as const,
} as const

export const SCREENS = {
  drawer: "(drawer)",
  board: "index",
  upcoming: "upcoming",
  trash: "trash",
  signIn: "sign-in",
  boardActions: "board/actions",
  boardPrefix: "board/prefix",
  boardReorder: "board/reorder",
  boardDelete: "board/delete",
  card: "card/[id]",
} as const
