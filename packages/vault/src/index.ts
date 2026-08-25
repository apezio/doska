export type { DirEntry, FileStat, Unwatch, VaultFs, WatchListener } from "./fs"
export { canonicalBody } from "./format/body"
export { CardFile } from "./format/card-file"
export type { CardFileName } from "./format/paths"
export {
  cardFileName,
  deslug,
  dirPath,
  folderName,
  HISTORY_FILE,
  joinPath,
  MIRROR_FILE,
  parseCardFileName,
  slug,
  TRASH_DIR,
  uniqueName,
  VAULT_DIR,
} from "./format/paths"
export type { CardPatch, Merge, MergedField, MergeInput } from "./merge/merge"
export { mergeCard, MERGED_FIELDS } from "./merge/merge"
export type { Projection } from "./merge/projection"
export { hashProjection, projectionOf } from "./merge/projection"
