import { SQLiteDB } from "@doska/client-db/sqlite"
import {
  CARDS,
  CARDS_BY_COLUMN,
  CARDS_BY_DEADLINE,
  CARDS_BY_NUMBER,
  COLUMNS,
  DASHBOARDS,
  META_STORE,
} from "@doska/core/constants"
import { openDatabaseSync } from "expo-sqlite"

const DB_NAME = "deck.db"
/** Tracked in `PRAGMA user_version`. Independent of the web DB's version — the
 * two schemas are only ever compared through the records they hold. */
const VERSION = 2

export const mobileDb = new SQLiteDB(
  DB_NAME,
  VERSION,
  {
    [CARDS]: [CARDS_BY_COLUMN, CARDS_BY_DEADLINE, CARDS_BY_NUMBER],
    [COLUMNS]: [],
    [DASHBOARDS]: [],
    [META_STORE]: [],
  },
  openDatabaseSync
)
