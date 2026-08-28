---
title: Environment variables
nav: Environment
description: "Every variable a self-hosted Doska reads from .env: what it does, and whether it is required."
order: 1
updated: "2026-08-27"
---

`AUTH_LOGIN`, `AUTH_PASSWORD` and `AUTH_SECRET` are required: the server has no
defaults and won't start without them. Everything else is optional.

| Variable            | Required | What it does                                                                                      |
| ------------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `AUTH_LOGIN`        | yes       | Login of the first admin account, created on first boot.                                          |
| `AUTH_PASSWORD`     | yes       | That account's first password.                                                                    |
| `AUTH_SECRET`       | yes       | Signs session tokens. Generate with `openssl rand -hex 32`.                                       |
| `BASE_URL`          | no       | This server's public origin, no trailing slash. Cookie sync works without it; MCP OAuth needs it. |
| `WEB_PORT`          | no       | Host port the web UI is published on (default `8080`).                                            |
| `DOCKER_IMAGE_TAG`  | no       | Release channel: `latest` (stable), `beta` (prerelease), or an exact version.                     |
| `POSTGRES_PASSWORD` | no       | Secures the bundled Postgres.                                                                     |
| `DATABASE_URL`      | no       | Point at your own managed Postgres; the bundled db is then ignored.                               |

## AUTH_LOGIN and AUTH_PASSWORD

These create one account, once, on the server's first boot. It's the admin, so
it can add everyone else from the app's [Accounts](/docs/accounts) screen.

After that they do nothing. Editing `AUTH_PASSWORD` and restarting won't change
the password. Use Accounts, where the admin can set anyone's, its own
included. Leave the pair in `.env` regardless: the server won't start without
it.

`DOCKER_IMAGE_TAG` also decides what the desktop app runs: it follows whatever
version the server it syncs with runs, so `beta` here puts the connected desktop
app on beta too.

The `beta` channel has nothing to resolve on this fork until a `v*-beta.N` tag
is cut, so leave it on `latest` until one is.
