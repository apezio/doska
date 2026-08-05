import { useState } from "react"
import { ChevronsRight } from "lucide-react"
import { MarkdownRenderersProvider } from "@doska/markdown"
import { cn } from "@doska/ui-kit"
import { AttachmentPlaceholder } from "./attachment"
import { BoardCard } from "./board-card"
import { cards } from "./cards"
import { Column } from "./column"
import { InstallTerminal, McpTerminal } from "./terminal"
import { Wikilink } from "./wikilink"

/**
 * The pieces of a body only the host can resolve. The app reads them off real
 * cards and attachments; here they are the page's own stand-ins.
 */
const renderers = {
  renderImage: (_key: string, alt: string) => (
    <AttachmentPlaceholder alt={alt} />
  ),
  renderWikilink: (target: string) => <Wikilink target={target} />,
}

/** The page's own board: the pitch, told as cards on a real column layout. */
export function Board() {
  const [scrolled, setScrolled] = useState(false)

  return (
    // The board canvas, on a dotted workspace grid.
    <div
      className="relative pb-24"
      style={{
        backgroundImage: "radial-gradient(var(--dots) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
      }}
    >
      <div
        className="overflow-x-auto"
        onScroll={(e) => setScrolled(e.currentTarget.scrollLeft > 8)}
      >
        <MarkdownRenderersProvider value={renderers}>
          <div className="mx-auto flex max-w-6xl items-start gap-5 px-4 py-8 sm:px-6">
            <Column title="Cards" color="violet" count={4}>
              <BoardCard
                id="CARD-1"
                title="Cards are Markdown"
                body={cards.markdown}
              />
              <BoardCard
                id="CARD-2"
                title="Attachments and tags"
                body={cards.attachments}
              />
              <BoardCard
                id="CARD-3"
                title="Deadlines"
                deadline="2020-04-01"
                body={cards.deadlines}
              />
              <BoardCard
                id="CARD-4"
                title="Cards link to cards"
                body={cards.refs}
              />
            </Column>

            <Column title="Where it lives" color="green" count={3}>
              <BoardCard
                id="DATA-1"
                title="Local-first"
                body={cards.localFirst}
              />
              <BoardCard id="DATA-2" title="Sync is opt-in" body={cards.sync} />
              <BoardCard
                id="DATA-3"
                title="Deleting is reversible"
                body={cards.trash}
              />
            </Column>

            <Column title="Run it" color="amber" count={4}>
              <BoardCard
                id="RUN-1"
                title="Self-host in one line"
                body={cards.selfHost}
                lead={<InstallTerminal />}
              />
              <BoardCard
                id="RUN-2"
                title="Runs where you do"
                body={cards.platforms}
              />
              <BoardCard
                id="RUN-3"
                title="Works on a phone"
                body={cards.phone}
              />
              <BoardCard
                id="RUN-4"
                title="Agents can edit it too"
                body={cards.agents}
              >
                <McpTerminal />
              </BoardCard>
            </Column>
          </div>
        </MarkdownRenderersProvider>
      </div>
      <ScrollHint hidden={scrolled} />
    </div>
  )
}

/**
 * Nudge that the board scrolls sideways. Mobile only — on wider screens the
 * columns already fit — and it retires the moment the visitor scrolls.
 */
function ScrollHint({ hidden }: { hidden: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        // Zero-height so it rides the viewport bottom without taking space.
        "pointer-events-none sticky bottom-8 z-10 flex h-0 justify-center transition-opacity duration-300 sm:hidden",
        hidden && "opacity-0"
      )}
    >
      {/* Dark in both themes — it reads as an overlay on the board, not a card. */}
      <span className="flex -translate-y-full items-center gap-2 rounded-full bg-[#232939] px-5 py-4 font-mono text-sm text-[#f7f7f8] shadow-lg shadow-black/25 dark:bg-[#1d2230]">
        scroll sideways
        <ChevronsRight className="size-4 animate-nudge motion-reduce:animate-none" />
      </span>
    </div>
  )
}
