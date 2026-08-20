import { describe, expect, it } from "vitest"
import { tokenStyles, tokenizeMarkdown, type Token, type TokenKind } from "../src"

/** The kinds on the first token whose text matches exactly. */
function kindsOf(tokens: Token[], text: string): TokenKind[] {
  const found = tokens.find((token) => token.text === text)
  if (!found) throw new Error(`no token reading ${JSON.stringify(text)}`)
  return found.kinds
}

function tokenizeLine(source: string, targets?: string[]): Token[] {
  const lines = tokenizeMarkdown(source, { targets })
  expect(lines).toHaveLength(1)
  return lines[0]
}

const SAMPLE = `# A heading with **bold**

Plain text, *emphasis*, \`code\`, ==mark== and ~~struck~~.
A [label](https://example.dev) and a [[12|Fix the sync bug]].

> quoted, with **bold** inside

- [ ] open task
- [x] ticked task
1) numbered item

---
-cut-

\`\`\`ts
const a = **not bold**
\`\`\`
`

describe("tokenizeMarkdown", () => {
  it("reproduces the source exactly", () => {
    // The overlay paints these tokens behind a textarea holding the same
    // string. A dropped or added character slides the two texts apart.
    const painted = tokenizeMarkdown(SAMPLE)
      .map((line) => line.map((token) => token.text).join(""))
      .join("\n")

    expect(painted).toBe(SAMPLE)
  })

  it("returns one entry per line, blank lines included", () => {
    expect(tokenizeMarkdown(SAMPLE)).toHaveLength(SAMPLE.split("\n").length)
    expect(tokenizeMarkdown("")).toEqual([[{ text: "", kinds: [] }]])
  })

  it("marks up the block a line opens", () => {
    expect(kindsOf(tokenizeLine("## Title"), "## ")).toEqual(["syntax"])
    expect(kindsOf(tokenizeLine("## Title"), "Title")).toEqual(["heading"])

    expect(kindsOf(tokenizeLine("> quoted"), "quoted")).toEqual(["quote"])
    expect(kindsOf(tokenizeLine("- item"), "- ")).toEqual(["syntax"])
    expect(kindsOf(tokenizeLine("- item"), "item")).toEqual([])

    expect(tokenizeLine("---")).toEqual([{ text: "---", kinds: ["syntax"] }])
    expect(tokenizeLine("-cut-")).toEqual([{ text: "-cut-", kinds: ["cut"] }])
  })

  it("dims a ticked task but not an open one", () => {
    expect(kindsOf(tokenizeLine("- [ ] open"), "open")).toEqual([])
    expect(kindsOf(tokenizeLine("- [x] done"), "done")).toEqual(["done"])
    // A task line also matches the bullet pattern, so order decides.
    expect(kindsOf(tokenizeLine("- [x] done"), "- [x] ")).toEqual(["syntax"])
  })

  it("styles inline spans and keeps their delimiters", () => {
    expect(kindsOf(tokenizeLine("a **b** c"), "b")).toEqual(["strong"])
    expect(kindsOf(tokenizeLine("a **b** c"), "**")).toEqual(["syntax"])
    expect(kindsOf(tokenizeLine("a *b* c"), "b")).toEqual(["emphasis"])
    expect(kindsOf(tokenizeLine("a _b_ c"), "b")).toEqual(["emphasis"])
    expect(kindsOf(tokenizeLine("a ~~b~~ c"), "b")).toEqual(["strike"])
    expect(kindsOf(tokenizeLine("a ==b== c"), "b")).toEqual(["mark"])
    expect(kindsOf(tokenizeLine("a `b` c"), "b")).toEqual(["code"])
  })

  it("nests spans inside the block that holds them", () => {
    expect(kindsOf(tokenizeLine("# A **b**"), "b")).toEqual([
      "heading",
      "strong",
    ])
    expect(kindsOf(tokenizeLine("> a *b*"), "b")).toEqual(["quote", "emphasis"])
  })

  it("separates a link's label from its url", () => {
    const tokens = tokenizeLine("see [docs](https://example.dev)")
    expect(kindsOf(tokens, "docs")).toEqual(["link"])
    expect(kindsOf(tokens, "https://example.dev")).toEqual(["url"])
    // An image is the same shape with a `!` on the front.
    expect(kindsOf(tokenizeLine("![alt](a.png)"), "![")).toEqual(["syntax"])
  })

  it("reads a wikilink as broken only when the targets say so", () => {
    const known = ["12"]
    expect(kindsOf(tokenizeLine("[[12]]", known), "12")).toEqual(["wikilink"])
    expect(kindsOf(tokenizeLine("[[99]]", known), "99")).toEqual([
      "brokenWikilink",
    ])
    // Ids used to carry a board prefix; those references still point at 12.
    expect(kindsOf(tokenizeLine("[[ROAD-12]]", known), "ROAD-12")).toEqual([
      "wikilink",
    ])
    // No list means the caller could not tell, so nothing is drawn as broken.
    expect(kindsOf(tokenizeLine("[[99]]"), "99")).toEqual(["wikilink"])
  })

  it("keeps a wikilink's alias readable and its brackets syntax", () => {
    const tokens = tokenizeLine("[[12|Fix the sync bug]]", ["12"])
    expect(kindsOf(tokens, "12")).toEqual(["wikilink"])
    expect(kindsOf(tokens, "Fix the sync bug")).toEqual([])
    expect(kindsOf(tokens, "[[")).toEqual(["syntax"])
  })

  it("leaves everything in a fenced block unparsed", () => {
    const lines = tokenizeMarkdown("```\n**not bold**\n```\nafter **bold**")
    expect(lines[1]).toEqual([{ text: "**not bold**", kinds: ["code"] }])
    expect(kindsOf(lines[3], "bold")).toEqual(["strong"])
  })

  it("gives the earliest span in a line precedence", () => {
    // The `[…]` of a link must not be claimed by the code span after it.
    const tokens = tokenizeLine("[a](b) and `c`")
    expect(kindsOf(tokens, "a")).toEqual(["link"])
    expect(kindsOf(tokens, "c")).toEqual(["code"])
    // Inside a code span nothing is markup.
    expect(kindsOf(tokenizeLine("`a **b**`"), "a **b**")).toEqual(["code"])
  })
})

describe("tokenStyles", () => {
  it("maps a token's kinds through a palette, in order", () => {
    const token: Token = { text: "b", kinds: ["heading", "strong"] }
    const theme: Partial<Record<TokenKind, string>> = {
      heading: "big",
      strong: "bold",
    }

    expect(tokenStyles(token, theme)).toEqual(["big", "bold"])
    // A kind the platform does not style simply drops out.
    expect(tokenStyles(token, { strong: "bold" })).toEqual(["bold"])
  })
})
