# Decisions

## 2026-11-16 — Embedded Miss Claude chats take Doska's theme as `?theme=`
- Decided by: operator ("Real dark theme"), over a Doska-only color inversion of the frame
- Decision: every Miss Claude frame in Doska gets `theme=dark` or `theme=light` appended to its URL, and Miss Claude draws its card and chat pages to match. Switching theme reloads the frame.
- Why: a page from another origin can't be restyled from Doska; inverting its colors would only approximate dark mode.
