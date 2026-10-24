import { Route, Switch } from "wouter"
import { BoardPage } from "@/components/app/board-page"
import { DigestPage } from "@/components/app/digest-page"
import { HomePage } from "@/components/app/home-page"
import { ProjectPage } from "@/components/app/project-page"
import { ProjectsPage } from "@/components/app/projects-page"
import { SignInPage } from "@/components/login/sign-in-page"
import { TrashPage } from "@/components/app/trash-page"
import { routes } from "./lib/routes"

export function Router() {
  return (
    <Switch>
      <Route path={routes.about()}>About</Route>
      <Route path={routes.signIn()}>
        <SignInPage />
      </Route>
      <Route path={routes.digest()} nest>
        <DigestPage />
      </Route>
      <Route path={routes.trash()}>
        <TrashPage />
      </Route>
      <Route path={routes.projects()}>
        <ProjectsPage />
      </Route>
      <Route path={routes.project.pattern}>
        {(params) => <ProjectPage projectId={params.id} />}
      </Route>
      <Route path={routes.deck.pattern} nest>
        {(params) => <BoardPage deckId={params.id} />}
      </Route>
      <Route>
        <HomePage />
      </Route>
    </Switch>
  )
}
