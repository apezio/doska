/**
 * Account administration, straight over better-auth's `admin` plugin. There are
 * no oRPC procedures behind this: the plugin's own routes already enforce the
 * admin check server-side, so the UI is the only thing missing.
 *
 * Accounts are deactivated, never deleted — `owner_id` and `created_by`
 * references outlive the row. The plugin calls it a ban; we call it inactive.
 */

import { authClient } from "./auth-client"

export type Account = {
  id: string
  login: string
  isAdmin: boolean
  active: boolean
}

/**
 * better-auth types the admin routes against its own user model, which has no
 * `username` — that column belongs to the `username` plugin and rides along on
 * the row without being in the type.
 */
type AdminUser = {
  id: string
  name: string
  username?: string | null
  role?: string | null
  banned?: boolean | null
}

type ClientError = { code?: string; message?: string }

/** Collisions surface as whichever unique column the server hit first. Both mean
 * the same thing to someone who only typed a login. */
const TAKEN = [
  "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
  "USERNAME_IS_ALREADY_TAKEN",
]

function fail(error: ClientError, fallback: string): never {
  if (error.code && TAKEN.includes(error.code))
    throw new Error("That login is already taken.")
  throw new Error(error.message || fallback)
}

export async function listAccounts(): Promise<Account[]> {
  const { data, error } = await authClient().admin.listUsers({
    query: { limit: 200, sortBy: "createdAt", sortDirection: "asc" },
  })
  if (error) fail(error, "Could not load accounts")

  return (data.users as AdminUser[]).map((user) => ({
    id: user.id,
    login: user.username ?? user.name,
    isAdmin: user.role === "admin",
    active: !user.banned,
  }))
}

export async function createAccount(
  login: string,
  password: string
): Promise<void> {
  const { error } = await authClient().admin.createUser({
    name: login,
    // Same synthetic address the first account is seeded with (see the server's
    // `seed.ts`): better-auth keys users by email, but a login isn't one.
    email: `${encodeURIComponent(login)}@deck.invalid`,
    password,
    // `createUser` takes only better-auth's core fields inline; the username
    // plugin's columns ride along in `data`.
    data: { username: login, displayUsername: login },
  })
  if (error) fail(error, "Could not create the account")
}

export async function setAccountPassword(
  id: string,
  password: string
): Promise<void> {
  const { error } = await authClient().admin.setUserPassword({
    userId: id,
    newPassword: password,
  })
  if (error) fail(error, "Could not set the password")
}

export async function setAccountActive(
  id: string,
  active: boolean
): Promise<void> {
  const { error } = active
    ? await authClient().admin.unbanUser({ userId: id })
    : await authClient().admin.banUser({ userId: id })
  if (error) fail(error, "Could not change the account")
}
