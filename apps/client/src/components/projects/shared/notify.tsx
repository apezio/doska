import { Toast } from "@doska/ui-kit"
import { toast } from "react-hot-toast"

function show(id: string, message: string) {
  toast.custom(
    (t) => (
      <Toast visible={t.visible}>
        <p role="status" className="px-3.5 py-2.5 text-sm">
          {message}
        </p>
      </Toast>
    ),
    { id, duration: 4000 }
  )
}

/** The edit was refused because someone — usually an agent — got there first;
 * the page already shows their version. */
export function notifyConflict() {
  show("project-conflict", "Updated elsewhere — refreshed")
}

export function notifyWriteError(err: Error) {
  show("project-error", `Couldn't save: ${err.message}`)
}
