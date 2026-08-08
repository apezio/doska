---
title: Accounts
nav: Accounts
badge: Beta
description: "More than one person on your Doska server: adding accounts, what each one gets, and what isn't shared yet."
order: 3
updated: "2026-08-09"
---

> **Beta.** Accounts aren't in a stable release yet

Your server can hold more than one account. Everyone signs in with their own
login and password.

## Add someone

Sign in as the admin, open **Accounts** in the sidebar, and give them a login
and a first password. Only the admin sees that button; there's no way for
someone to sign themselves up.

The admin is the account from `AUTH_LOGIN` / `AUTH_PASSWORD`, see
[Environment](/docs/self-hosting/environment).

## What they get

Their own boards, private to them. Nothing is copied over from you, so they
start empty.

## Passwords

The admin can set anyone's password from the same screen, its own included.
Changing `AUTH_PASSWORD` in `.env` does nothing once the server is running.

## Turning someone off

Deactivate them: they can't sign in, and their boards stay exactly where they
are. Reactivate any time and everything is back. Accounts aren't deleted, and
you can't deactivate yourself.
