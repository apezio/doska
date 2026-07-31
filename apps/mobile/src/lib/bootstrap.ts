import { seed } from "@doska/core/db"
import { purgeExpired } from "@doska/core/operations"
// The hlc subpath rather than `@doska/core/sync`: the clock is needed to stamp
// local edits, the sync engine it sits next to isn't wired until DSK-76.
import { seedClock } from "@doska/core/sync/hlc"

/** What has to have happened before anything reads or writes a record. */
export async function bootstrap(): Promise<void> {
  // Restore the high-water mark before any stamp is issued, or a local edit can
  // be timestamped below one already handed out and lose LWW silently.
  await seedClock()

  await seed()

  // Empty the trash of anything past its 14 days. Not awaited: nothing rendered
  // reads tombstones.
  void purgeExpired()
}
