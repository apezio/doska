import { QueryClient } from "@tanstack/react-query"

/**
 * The app's single QueryClient. Lives here (rather than inline in `main.tsx`) so
 * non-React code — namely the background sync in `api/sync` — can
 * invalidate queries after applying changes pulled from the server.
 *
 * Writes hit IndexedDB, not the network (the server is reached only by the
 * separate sync engine), so mutations run "always" — the default "online" pauses
 * every local edit until reconnect. Reads opt in per-query.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    mutations: { networkMode: "always" },
  },
})
