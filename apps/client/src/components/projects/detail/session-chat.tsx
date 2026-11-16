import { useEffect, useRef, useState, type ReactNode } from "react"
import type { ProjectSessionDetail } from "@doska/contract"
import { Maximize2, Minimize2, SquareArrowOutUpRight, X } from "lucide-react"
import {
  Button,
  buttonVariants,
  cn,
  Hint,
  Sheet,
  SheetContent,
  SheetTitle,
} from "@doska/ui-kit"
import { ChatFrame } from "./chat-frame"
import { useProjectCtx } from "./project-context"

const TITLE = "min-w-0 flex-1 truncate text-sm font-semibold"

/**
 * The session's Miss Claude chat, framed from its dashboard: reading and
 * typing go straight to the console. Signed in there only when Doska and
 * that dashboard are same-site; otherwise the frame shows its login.
 * `chatSay` is posted in as typed text; Miss Claude drops it unless its
 * CHAT_EMBED_ORIGINS lists this origin.
 *
 * `docked` puts it in a column beside the page, which stays usable; below
 * that width it falls back to a Sheet over the page. `chatBig` makes either
 * one cover the whole window; only classes change, so the frame keeps its
 * scroll and half-typed text.
 */
export function SessionChat({ docked }: { docked: boolean }) {
  const { chatSessionId, openChat, sessionById, chatBig } = useProjectCtx()
  const session = chatSessionId ? sessionById.get(chatSessionId) : undefined
  const name = session && (session.label || session.mission)

  if (docked && session?.chatUrl)
    return (
      <aside
        className={cn(
          "flex shrink-0 flex-col bg-popover text-popover-foreground",
          chatBig ? "fixed inset-0 z-50" : "w-md border-l"
        )}
      >
        <ChatPanel
          key={session.chatUrl}
          session={session}
          title={<h2 className={TITLE}>{name}</h2>}
        />
      </aside>
    )

  return (
    <Sheet
      open={!!session?.chatUrl}
      onOpenChange={(open) => !open && openChat(null)}
    >
      <SheetContent
        className={cn(
          "right-0 left-auto w-full gap-0 border-r-0 border-l data-ending-style:translate-x-10 data-starting-style:translate-x-10",
          chatBig ? "sm:max-w-none" : "sm:max-w-md"
        )}
      >
        {session?.chatUrl && (
          <ChatPanel
            key={session.chatUrl}
            session={session}
            title={<SheetTitle className={TITLE}>{name}</SheetTitle>}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function ChatPanel({
  session,
  title,
}: {
  session: ProjectSessionDetail
  title: ReactNode
}) {
  const { chatSay, openChat, chatBig: big, setChatBig } = useProjectCtx()
  const frame = useRef<HTMLIFrameElement>(null)
  const [loaded, setLoaded] = useState(false)

  // Also after load: with the page usable beside it, a drop onto this
  // session's card sends here while the chat is already open.
  useEffect(() => {
    if (!loaded || !chatSay) return
    frame.current?.contentWindow?.postMessage(
      { type: "chat-send", text: chatSay },
      new URL(session.chatUrl!).origin
    )
    openChat(session.id)
  }, [loaded, chatSay, session.id, session.chatUrl, openChat])

  return (
    <>
      <div className="flex items-center gap-2 border-b px-3 py-2">
        {title}
        {session.openUrl && (
          <a
            href={session.openUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ size: "sm", variant: "ghost" }),
              "shrink-0"
            )}
          >
            <SquareArrowOutUpRight />
            Full view
          </a>
        )}
        {/* A phone's sheet is already full width. */}
        <Hint label={big ? "Shrink chat" : "Enlarge chat"}>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={big ? "Shrink chat" : "Enlarge chat"}
            className="max-sm:hidden"
            onClick={() => setChatBig(!big)}
          >
            {big ? <Minimize2 /> : <Maximize2 />}
          </Button>
        </Hint>
        <Hint label="Close">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close"
            onClick={() => openChat(null)}
          >
            <X />
          </Button>
        </Hint>
      </div>
      <ChatFrame
        ref={frame}
        src={session.chatUrl!}
        title={`Chat with ${session.label || session.mission}`}
        allow="microphone; autoplay"
        onLoad={() => setLoaded(true)}
        className="min-h-0 w-full flex-1"
      />
    </>
  )
}
