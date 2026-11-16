# Decisions

## 2026-11-16 — Embedded Miss Claude chats take Doska's theme as `?theme=`
- Decided by: operator ("Real dark theme"), over a Doska-only color inversion of the frame
- Decision: every Miss Claude frame in Doska gets `theme=dark` or `theme=light` appended to its URL, and Miss Claude draws its card and chat pages to match. Switching theme reloads the frame.
- Why: a page from another origin can't be restyled from Doska; inverting its colors would only approximate dark mode.

## 2026-11-16 — Project summaries lead with what is left; "Done so far" starts folded
- Decided by: operator ("i definitely dont want to see the things that were ALREADY done, much less at the top. maybe at most hidden behind a default closed disclosure triangle")
- Decision: the project page shows the summary as lead sentence, Next step, Waiting on you (hidden when it says nothing), Still open, then "Done so far" in a disclosure that starts closed. Agents are told to write the blocks in that order, one short line per item, with evidence kept in the activity log.
- Why: the summary read as a wall of text that opened with finished work.
