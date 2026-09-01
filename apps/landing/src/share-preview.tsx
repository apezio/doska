import { Avatar, AvatarFallback, Button } from "@doska/ui-kit"
import { Copy, Globe, UserPlus } from "lucide-react"

const members = [
  { name: "rita", tags: ["Owner", "You"] },
  { name: "mira", tags: [] },
  { name: "tom", tags: [] },
]

function Tag({ children }: React.PropsWithChildren) {
  return (
    <span className="rounded border px-1 text-[0.7rem] text-muted-foreground">
      {children}
    </span>
  )
}

export function SharePreview() {
  return (
    <div className="dark-surface w-full max-w-lg rounded-xl border bg-card shadow-xl">
      <div className="border-b px-4 py-3 font-semibold">Share</div>
      <div className="space-y-4 p-4">
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <UserPlus className="size-4 text-muted-foreground" />
            Add someone
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">sam</span>
            <Button variant="ghost" size="sm">
              Add
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-xs text-muted-foreground">3 members</div>
          <ul className="flex flex-col rounded-lg border">
            {members.map((member) => (
              <li
                key={member.name}
                className="flex items-center gap-3 border-b p-3 last:border-b-0"
              >
                <Avatar>
                  <AvatarFallback className="text-xs">
                    {member.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">
                    {member.name}
                  </span>
                  <div className="flex items-center gap-1">
                    {member.tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </div>
                </div>
                {member.tags.length === 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-destructive"
                  >
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="flex items-start gap-3">
            <Globe className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="font-medium">Anyone with the link</div>
              <p className="text-sm text-muted-foreground">
                Read-only, and no account needed. Turning it off breaks the
                existing link for good.
              </p>
            </div>
            <Button variant="ghost" size="sm">
              Turn off
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate rounded-md border bg-muted/40 px-2 py-1.5 font-mono text-xs text-muted-foreground">
              app.doska.sh/p/8f3c1a9e
            </span>
            <Button variant="ghost" size="sm">
              <Copy />
              Copy
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
