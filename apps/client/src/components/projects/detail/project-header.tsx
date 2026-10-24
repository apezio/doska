import { useState } from "react"
import { useLocation } from "wouter"
import { MoreHorizontal, Trash2 } from "lucide-react"
import {
  Button,
  Hint,
  InvisibleInput,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "@doska/ui-kit"
import { timeAgo } from "@doska/core/projects"
import { routes } from "@/lib/routes"
import { ConfirmDialog } from "../../confirm-dialog"
import { PageHeader } from "../../app/page-header"
import { PROJECT_STATUS } from "../shared/status"
import { StatusMenu } from "../shared/status-menu"
import { useProjectWrite } from "../shared/use-project-write"
import { useProjectCtx } from "./project-context"
import { BackLink } from "./back-link"

export function ProjectHeader() {
  const { detail, projectId } = useProjectCtx()
  const { project } = detail
  const [, navigate] = useLocation()
  const [confirming, setConfirming] = useState(false)
  const { mutate: update } = useProjectWrite("update", projectId)
  const { mutate: remove } = useProjectWrite("remove", projectId)

  return (
    <PageHeader className="gap-1.5">
      <BackLink />
      <span className="text-muted-foreground/40" aria-hidden>
        /
      </span>
      <h1 className="min-w-0 flex-1 md:flex-none">
        <InvisibleInput
          value={project.name}
          label="Project name"
          onCommit={(name) => update({ id: projectId, name })}
          className="-ml-1.5 block max-w-[40ch] truncate px-1.5 text-base font-semibold tracking-heading"
        />
      </h1>
      <StatusMenu
        label="Project status"
        value={project.status}
        options={PROJECT_STATUS}
        onChange={(status) => update({ id: projectId, status })}
      />
      <span className="ml-auto shrink-0 text-xs text-muted-foreground max-md:hidden">
        Updated {timeAgo(project.updatedAt)}
      </span>
      <Menu>
        <Hint label="Project actions">
          <MenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Project actions"
                className="shrink-0 text-muted-foreground max-md:ml-auto"
              />
            }
          >
            <MoreHorizontal />
          </MenuTrigger>
        </Hint>
        <MenuContent className="py-1">
          <MenuItem
            onClick={() => setConfirming(true)}
            className="text-destructive"
          >
            <Trash2 />
            Delete project
          </MenuItem>
        </MenuContent>
      </Menu>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Delete project?"
        description={`"${project.name}" and its workstreams, decisions and history go away. Linked cards stay on their boards.`}
        confirmLabel="Delete project"
        onConfirm={() =>
          remove(
            { id: projectId },
            { onSuccess: () => navigate(`~${routes.projects()}`) }
          )
        }
      />
    </PageHeader>
  )
}
