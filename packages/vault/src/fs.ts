export interface DirEntry {
  name: string
  isDirectory: boolean
}

export interface FileStat {
  mtime: number
  isDirectory: boolean
}

export type WatchListener = (paths: string[]) => void

export type Unwatch = () => void

/** The filesystem vault */
export interface VaultFs {
  read(path: string): Promise<string | null>
  /** Replaces the file. The parent folder has to exist already. */
  write(path: string, content: string): Promise<void>
  /** Creates a folder and any missing parents; fine if it's already there. */
  mkdir(path: string): Promise<void>
  /** Moves a file or a whole folder. The target's parent has to exist. */
  rename(from: string, to: string): Promise<void>
  /** Deletes a file, or a folder with everything under it. Missing is fine. */
  remove(path: string): Promise<void>
  /** One level of a folder, or null when the folder isn't there. */
  readDir(path: string): Promise<DirEntry[] | null>
  stat(path: string): Promise<FileStat | null>
  /** Watches a folder and everything under it, recursively. */
  watch(path: string, listener: WatchListener): Promise<Unwatch>
}
