import { buildApp } from "./app"
import { seedAccount } from "./auth/seed"
import { runMigrations } from "./db/utils/run-migrations"
import { env } from "./env"
import { startPurgeJob } from "./purge-job"

const app = buildApp()

const { port, host } = env

runMigrations()
  .then(seedAccount)
  .then(() => app.listen({ port, host }))
  .then(() => startPurgeJob(app.log))
  .catch((err) => {
    app.log.error(err)
    process.exit(1)
  })
