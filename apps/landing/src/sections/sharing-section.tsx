import { DemoBoards } from "../demo-boards"
import { SharePreview } from "../share-preview"
import { Section } from "./section"

export function SharingSection() {
  return (
    <Section
      title="Shared between multiple people"
      subtitle="Create accounts and share with others, or make a public board."
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch">
        <SharePreview />
        <DemoBoards />
      </div>
    </Section>
  )
}
