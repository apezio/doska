import { Button } from "@doska/ui-kit"
import { ChevronRight, ExternalLink } from "lucide-react"
import type { ReactNode } from "react"

interface IProps {
  icon: ReactNode
  label: string
  /** Set this for an outside link, or `onClick` for something in the app. */
  href?: string
  onClick?: () => void
}

export function SettingsRow({ icon, label, href, onClick }: IProps) {
  return (
    <Button
      variant="ghost"
      className="h-auto w-full justify-start gap-2 py-2"
      onClick={onClick}
      render={
        href ? <a href={href} target="_blank" rel="noreferrer" /> : undefined
      }
    >
      {icon}
      <span className="text-sm">{label}</span>
      {href ? (
        <ExternalLink className="ml-auto size-4 text-muted-foreground" />
      ) : (
        <ChevronRight className="ml-auto size-4 text-muted-foreground" />
      )}
    </Button>
  )
}
