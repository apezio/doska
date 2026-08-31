import { Board } from "../board"
import { SectionHeading } from "./section"

export function BoardSection() {
  return (
    <section className="mt-16">
      <div className="mx-auto mb-4 max-w-6xl px-4 sm:px-6">
        <SectionHeading title="Everything else" />
      </div>
      <Board />
    </section>
  )
}
