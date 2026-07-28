import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { createBoard } from "./board"
import { INSTRUCTIONS } from "./guide"
import { registerBoardTools } from "./tools/boards"
import { registerCardTools } from "./tools/cards"
import { registerColumnTools } from "./tools/columns"
import { registerSearchTools } from "./tools/search"
import type { BoardStore } from "./store"

export type { BoardStore } from "./store"

export function createBoardServer(
  store: BoardStore,
  version: string
): McpServer {
  const server = new McpServer(
    { name: "doska", version },
    // The board's concepts and Markdown dialect, which no tool schema can carry
    // on its own. Clients put these in front of the first call.
    { instructions: INSTRUCTIONS }
  )
  const board = createBoard(store)

  registerBoardTools(server, board)
  registerColumnTools(server, board)
  registerCardTools(server, board)
  registerSearchTools(server, board)
  return server
}
