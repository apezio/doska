import type { ReactNode } from "react"
import { Toast } from "@doska/ui-kit"
import { toast } from "react-hot-toast"

/** A short project-page notice; a later one with the same id replaces it. */
export function notify(id: string, message: ReactNode, duration = 4000) {
  toast.custom(
    (t) => (
      <Toast visible={t.visible}>
        <p role="status" className="px-3.5 py-2.5 text-sm">
          {message}
        </p>
      </Toast>
    ),
    { id, duration }
  )
}

/** The edit was refused because someone — usually an agent — got there first;
 * the page already shows their version. */
export function notifyConflict() {
  notify("project-conflict", "Updated elsewhere — refreshed")
}

export function notifyWriteError(err: Error) {
  notify("project-error", `Couldn't save: ${err.message}`)
}
