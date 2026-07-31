import { seed } from "@doska/core/db"
import { purgeExpired } from "@doska/core/operations"
import { seedClock, startBackgroundSync } from "@doska/core/sync"

/** What has to have happened before anything reads or writes a record. */
export async function bootstrap(): Promise<void> {
  // Restore the high-water mark before any stamp is issued, or a local edit can
  // be timestamped below one already handed out and lose LWW silently.
  await seedClock()

  // Below `seedClock` and not above it: this reconciles once before it returns,
  // which is already too late to restore the clock.
  startBackgroundSync()

  await seed()

  // Empty the trash of anything past its 14 days. Not awaited: nothing rendered
  // reads tombstones.
  void purgeExpired()
}
