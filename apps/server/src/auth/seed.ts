import { eq, isNull } from "drizzle-orm"
import { getDB } from "../db/get-db"
import { dashboards, user } from "../db/schema"
import { env } from "../env"
import { auth } from "."

/**
 * A self-hosted deploy configures its first account with
 * AUTH_LOGIN/AUTH_PASSWORD, and has since before there was a user table. This
 * turns that env pair into a real better-auth user on first boot, going through
 * the sign-up API so the password is hashed by whatever better-auth expects
 * today rather than by us. The account is the deploy's owner: `role: "admin"`,
 * so it can create the others.
 *
 * Runs on every boot and creates nothing once an account exists: the credentials
 * in the env are the *seed*, not the source of truth, so rotating AUTH_PASSWORD
 * on an existing install does not silently reset the account.
 */
export async function seedAccount(): Promise<void> {
  if (!env.authLogin || !env.authPassword) {
    throw new Error("Auth misconfigured: set AUTH_LOGIN and AUTH_PASSWORD.")
  }

  const ownerId = (await findOwner()) ?? (await createOwner())

  // Migrations run before this, so on a fresh install their backfill had no user
  // to point at. Idempotent: a later boot finds nothing to adopt.
  await getDB()
    .update(dashboards)
    .set({ ownerId })
    .where(isNull(dashboards.ownerId))
}

/** The deploy's owner: the oldest account, matching the migrations' backfill. */
async function findOwner(): Promise<string | null> {
  const [existing] = await getDB()
    .select({ id: user.id })
    .from(user)
    .orderBy(user.createdAt)
    .limit(1)
  return existing?.id ?? null
}

async function createOwner(): Promise<string> {
  const { authLogin, authPassword } = env

  const created = await auth.api.signUpEmail({
    body: {
      name: authLogin,
      // better-auth keys users by email, but a login isn't one (e2e signs in as
      // "e2e"). Nothing ever sends mail here, so a synthetic address off a
      // reserved TLD satisfies the schema without pretending to be deliverable.
      email: `${encodeURIComponent(authLogin)}@deck.invalid`,
      password: authPassword,
      username: authLogin,
    },
  })

  // The admin plugin marks `role` as `input: false`, so sign-up can't set it.
  await getDB()
    .update(user)
    .set({ role: "admin" })
    .where(eq(user.id, created.user.id))

  return created.user.id
}
