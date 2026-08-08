---
title: Desktop and mobile
nav: Desktop & mobile
description: "The Doska macOS app, installing the client as a PWA"
order: 5
updated: "2026-08-07"
---

The same client runs in three places: a browser tab, a phone home screen, and a
Tauri macOS app. 

## macOS app

Download the latest build from
[Releases](https://github.com/romenkova/doska/releases). It wraps the client
with [Tauri](https://tauri.app) and auto-updates.

Builds aren't notarized yet, so on first launch clear the quarantine flag:

```sh
xattr -dr com.apple.quarantine /Applications/Doska.app
```

To sync, open the app's sync settings and set the server URL to your server's
address, the same one you open the web UI at. Sign in with the `AUTH_LOGIN` /
`AUTH_PASSWORD` from its `.env`.

The desktop app follows whatever version its server runs, and downloads the same version of the app on updates.

## Install as a PWA 

From the browser, install the app to your home screen or dock. It runs
fullscreen, and because the boards are already local it works offline the same
way the tab does.
