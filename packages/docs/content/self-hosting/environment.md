---
title: Environment variables
nav: Environment
description: "Every variable a self-hosted Doska reads from .env: what it does, and whether it is required."
order: 1
---

`AUTH_LOGIN`, `AUTH_PASSWORD` and `AUTH_SECRET` are required: the server has no
defaults and won't start without them. Everything else is optional.

| Variable            | Required | What it does                                                                                      |
| ------------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `AUTH_LOGIN`        | yes       | The account's login.                                                                              |
| `AUTH_PASSWORD`     | yes       | The account's password.                                                                           |
| `AUTH_SECRET`       | yes       | Signs session tokens. Generate with `openssl rand -hex 32`.                                       |
| `BASE_URL`          | no       | This server's public origin, no trailing slash. Cookie sync works without it; MCP OAuth needs it. |
| `WEB_PORT`          | no       | Host port the web UI is published on (default `8080`).                                            |
| `DOCKER_IMAGE_TAG`  | no       | Release channel: `latest` (stable), `beta` (prerelease), or an exact version.                     |
| `POSTGRES_PASSWORD` | no       | Secures the bundled Postgres.                                                                     |
| `DATABASE_URL`      | no       | Point at your own managed Postgres; the bundled db is then ignored.                               |

`DOCKER_IMAGE_TAG` also decides what the desktop app runs: it follows whatever
version the server it syncs with runs, so `beta` here puts the connected desktop
app on beta too.
