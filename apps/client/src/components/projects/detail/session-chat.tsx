import { SquareArrowOutUpRight, X } from "lucide-react"
import {
  Button,
  buttonVariants,
  cn,
  Hint,
  Sheet,
  SheetContent,
  SheetTitle,
} from "@doska/ui-kit"
import { useProjectCtx } from "./project-context"

/**
 * The session's Miss Claude chat, framed from its dashboard: reading and
 * typing go straight to the console. Signed in there only when Doska and
 * that dashboard are same-site; otherwise the frame shows its login.
 */
export function SessionChat() {
  const { chatSessionId, openChat, sessionById } = useProjectCtx()
  const session = chatSessionId ? sessionById.get(chatSessionId) : undefined
  const close = () => openChat(null)

  return (
    <Sheet open={!!session?.chatUrl} onOpenChange={(open) => !open && close()}>
      <SheetContent className="right-0 left-auto w-full gap-0 border-r-0 border-l data-ending-style:translate-x-10 data-starting-style:translate-x-10 sm:max-w-md">
        {session?.chatUrl && (
          <>
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <SheetTitle className="min-w-0 flex-1 truncate text-sm font-semibold">
                {session.label || session.mission}
              </SheetTitle>
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
              <Hint label="Close">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Close"
                  onClick={close}
                >
                  <X />
                </Button>
              </Hint>
            </div>
            <iframe
              key={session.chatUrl}
              src={session.chatUrl}
              title={`Chat with ${session.label || session.mission}`}
              allow="microphone"
              className="min-h-0 w-full flex-1 border-0 bg-background"
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
