import { parse, stringify, Scalar } from "yaml"

// 1. Does an unquoted ISO date stay a string (YAML 1.2), or become a Date?
const p = parse('deadline: 2026-09-01\naliases:\n  - "12"\n  - 13\ntags: [work, "a, b"]\nn: 5\n')
console.log("parsed:", JSON.stringify(p), p.deadline?.constructor?.name)

// 2. Can I force double quotes on just the title?
const title = new Scalar("Fix the sync bug")
title.type = Scalar.QUOTE_DOUBLE
console.log("---")
console.log(stringify({ id: "card-1", title, deadline: "2026-09-01", aliases: ["12"], tags: ["work"] }, { lineWidth: 0 }))
console.log("---")
// 3. Nasty title + long title folding
const nasty = new Scalar('He said "no": a\\b\n' + "x".repeat(90))
nasty.type = Scalar.QUOTE_DOUBLE
console.log(stringify({ title: nasty }, { lineWidth: 0 }))
console.log("roundtrip:", JSON.stringify(parse(stringify({ title: nasty }, { lineWidth: 0 })).title))
// 4. Malformed
try { parse("a: [unclosed\n") } catch (e) { console.log("throws:", e.constructor.name) }
