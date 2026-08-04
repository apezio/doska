# Doska

<img width="1496" height="847" alt="image" src="https://github.com/user-attachments/assets/3ae8bde7-b546-45e3-87a4-060f02007c34" />

A Kanban board where the cards are Markdown. It's local-first: your boards live
in the browser (IndexedDB), so it's fast and works without an account. Sync is
opt-in. Point it at a server you run and that server keeps the canonical copy,
replicated to every device.

Runs in the browser, installs as a PWA, or ships as a native macOS app.

> Browser storage isn't permanent. The app asks the browser not to evict it, but
> that's best-effort: the browser can still clear it, and "clear site data"
> always will. So treat local-only as a working copy. If the boards matter, run
> a server and let it keep the durable one.

## Features

### Cards

- **Multiple boards**, each with draggable columns. Drag cards to reorder or
  move them between columns.
- Cards are **GitHub-flavored Markdown**, edited in place: bold, code, links,
  highlights, and task lists that carry a live count in the card header. A slash
  menu and inline suggestions for formatting.
- **Attach files** by dropping them on a card or pasting from the clipboard;
  images preview inline (requires S3 compatible bucket).
- **Tags**: bracketed words become colored pills.
- **Cards link to cards** (wikilink): type `[[` and pick one.
- **Deadlines**: set one and the card shows a chip that shifts color as the date
  nears, turning red once it's overdue.
- An **Upcoming** view gathers cards from every board by deadline: overdue ones
  first, then grouped by day.

### Where it lives

- **Local-first** storage (IndexedDB): reads and writes hit the browser, not the
  network, so the UI is instant and works offline.
- **Opt-in sync**: give it a server you control and boards replicate across your
  devices in the background, every couple of seconds or on `⌘`+`S`.
- **Deleting is reversible**. `⌘`+`Z` takes back the last delete; everything
  else waits in the trash.

### Run it

- Runs **in the browser**, installs as a **PWA** (fullscreen and offline from
  your phone's home screen), or ships as a **Tauri macOS app** that reuses the
  same client and auto-updates.
- **One-line self-host installer** that generates the secrets and brings the
  stack up.
- Boards are exposed over [**MCP**](#mcp), so an agent can read and edit them.
- **Dark and light themes.**

## Self-hosting

Run your own server to keep your boards for real and sync them across devices.
Without one they live only in the browser: fine for trying it out, not for
anything you want to keep.

```sh
curl -fsSL https://raw.githubusercontent.com/romenkova/doska/main/install.sh -o install.sh && sh install.sh
```

The installer asks for a login, password, and (optionally) a domain, generates
the secrets for you, and brings the stack up. Re-run it any time to pull newer
images — it keeps your existing `.env`.

<details>
<summary>Or set it up by hand</summary>

```sh
curl -O https://raw.githubusercontent.com/romenkova/doska/main/docker-compose.selfhost.yml
curl -o .env https://raw.githubusercontent.com/romenkova/doska/main/.env.selfhost.example
# edit .env — set AUTH_PASSWORD, AUTH_SECRET (e.g. `openssl rand -hex 32`),
# and BASE_URL (this server's public origin, e.g. http://<your-host>:8080)
docker compose -f docker-compose.selfhost.yml up -d
```

</details>

Open the web UI at `http://<your-host>:8080` and sign in with the `AUTH_LOGIN` /
`AUTH_PASSWORD` from your `.env`. To sync the **desktop app**, open its sync
settings and set the server URL to the same address.

Postgres comes bundled and lives in a Docker volume. To run it elsewhere, point
`DATABASE_URL` at a managed instance instead.

- `WEB_PORT` — host port for the web UI (default `8080`).
- `DOCKER_IMAGE_TAG` — pin a release (e.g. `0.4.0`) instead of `latest`.
- `DATABASE_URL` — point at your own managed Postgres (optional).
- `BASE_URL` — this server's public origin. Cookie sync works without it; MCP
  OAuth needs it.

> **Single user per server:** the credentials in `.env` are the only account currently.

Deploying with [Dokploy](https://dokploy.com)? Use `docker-compose.dokploy.yml`.

### HTTPS

For a public deployment, set `DOMAIN` in `.env` (point its DNS at the host
first), set `BASE_URL=https://$DOMAIN`, and start with the `https` profile. A
bundled Caddy proxy fetches and auto-renews a Let's Encrypt certificate:

```sh
docker compose -f docker-compose.selfhost.yml --profile https up -d
```

### Backups

If your boards live in the bundled Postgres, dump it to `./backups/` any time:

```sh
./backup.sh
```

`install.sh` also runs this automatically before it redeploys over an existing
database. Restore a dump into an empty database, with only `db` running — a
booted server has already created the schema and the admin account, and the dump
would land on top of them:

```sh
docker compose -f docker-compose.selfhost.yml down --volumes
docker compose -f docker-compose.selfhost.yml up -d --wait db
gunzip -c backups/doska-XXXX.sql.gz | \
  docker compose -f docker-compose.selfhost.yml exec -T db psql -U doska doska
docker compose -f docker-compose.selfhost.yml up -d
```

(If you use a managed `DATABASE_URL`, back it up through your provider instead —
`backup.sh` skips it.)

## Desktop app

Download the latest macOS build from
[Releases](https://github.com/romenkova/doska/releases). It wraps the same client (with Tauri)
and auto-updates.

> macOS builds aren't notarized yet, so on first launch clear the quarantine
> flag: `xattr -dr com.apple.quarantine /Applications/Doska.app`.

## MCP

The server exposes your boards to an MCP client (Claude Code, Claude Desktop,
claude.ai) at `/mcp`, so an agent can read and edit them — create cards, tick off
task lists, move things between columns:

```sh
claude mcp add --transport http doska https://your-server/mcp
```

Sign-in happens in the browser on the first call (OAuth). Edits go through the
same sync tables the apps use, so they reach your other devices on their next
sync. Tools are listed in [packages/mcp/README.md](packages/mcp/README.md).

## Development

Requires **Node 22+** and **pnpm 11+** (see `.nvmrc` / `package.json` engines).

```sh
pnpm install
pnpm dev        # web client + server, in watch mode
pnpm desktop    # native desktop shell (Tauri)
```

The client dev server proxies the sync API to the local server, so sync works end
to end with no extra setup.

| Command           | What it does                     |
| ----------------- | -------------------------------- |
| `pnpm build`      | Build all web/server packages.   |
| `pnpm lint`       | Lint all packages.               |
| `pnpm type-check` | Type-check all packages.         |
| `pnpm format`     | Prettier-format the repo.        |
| `pnpm e2e`        | Run Playwright end-to-end tests. |

## License

See [LICENSE](LICENSE).
