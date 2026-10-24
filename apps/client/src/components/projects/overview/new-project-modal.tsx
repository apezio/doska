import { useState } from "react"
import { useLocation } from "wouter"
import {
  Button,
  Input,
  Modal,
  ModalContent,
  ModalContentCentered,
  ModalDescription,
  ModalHeader,
  Textarea,
} from "@doska/ui-kit"
import { routes } from "@/lib/routes"
import { useProjectWrite } from "../shared/use-project-write"

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewProjectModal({ open, onOpenChange }: IProps) {
  const [, navigate] = useLocation()
  const [name, setName] = useState("")
  const [summary, setSummary] = useState("")
  const { mutate: create, isPending } = useProjectWrite("create", null)

  const submit = () => {
    if (!name.trim()) return
    create(
      { name: name.trim(), summary: summary.trim() || undefined },
      {
        onSuccess: (project) => {
          onOpenChange(false)
          setName("")
          setSummary("")
          navigate(`~${routes.project.to(project.id)}`)
        },
      }
    )
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-md">
        <ModalHeader onClose={() => onOpenChange(false)}>
          New project
        </ModalHeader>
        <ModalContentCentered className="md:px-3 md:pb-3">
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <ModalDescription>
              One goal, split into workstreams that you and Claude sessions work
              through.
            </ModalDescription>
            <Input
              aria-label="Project name"
              placeholder="Name, e.g. Move DNS to the new provider"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Textarea
              aria-label="Where things stand"
              placeholder="Where things stand (optional, Markdown)"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
            <div className="flex justify-end gap-1.5">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim() || isPending}>
                Create project
              </Button>
            </div>
          </form>
        </ModalContentCentered>
      </ModalContent>
    </Modal>
  )
}
