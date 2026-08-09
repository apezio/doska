import { Route, Switch } from "wouter"
import { routes } from "@/lib/routes"
import { PublicBoardPage } from "./public-board-page"

/**
 * The whole app a visitor on a share link gets. It is mounted instead of
 * `Router`, not inside it — no sidebar, no account, and nothing that would need
 * either.
 */
export function PublicRouter() {
  return (
    <Switch>
      <Route path={routes.public.pattern} nest>
        {(params) => (
          <PublicBoardPage
            token={params.token}
            closeHref={`~${routes.public.to(params.token)}`}
          />
        )}
      </Route>
    </Switch>
  )
}
