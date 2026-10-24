import { Link } from "wouter"
import { ChevronLeft } from "lucide-react"
import { buttonVariants, cn } from "@doska/ui-kit"
import { routes } from "@/lib/routes"

export function BackLink() {
  return (
    <Link
      href={`~${routes.projects()}`}
      aria-label="All projects"
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "-ml-1 shrink-0 gap-0.5 px-1.5 text-muted-foreground"
      )}
    >
      <ChevronLeft />
      <span className="max-sm:hidden">Projects</span>
    </Link>
  )
}
