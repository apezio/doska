import { PhoneFrame } from "../phone-frame"
import { SyncBadge } from "../sync-badge"
import { InstallTerminal } from "../terminal"
import { Section } from "./section"

export function DevicesSection() {
  return (
    <Section
      title="On multiple devices"
      subtitle="Self-host a sync server and sync boards across devices."
    >
      <div className="flex flex-col gap-8 sm:flex-row sm:items-stretch">
        <div className="min-w-0 sm:w-1/3">
          <InstallTerminal />
        </div>
        <div className="relative mx-auto h-64 w-72 shrink-0 sm:mx-0 sm:h-auto">
          <PhoneFrame
            src="/mobile.png"
            alt="The same board on a phone"
            className="absolute inset-0"
          />
        </div>
        <div className="relative hidden min-w-0 flex-1 overflow-hidden sm:block">
          <img
            src="/board-dark.png"
            alt="The same board on a desktop"
            className="absolute inset-0 h-full w-full max-w-none rounded-2xl border object-cover object-left-top shadow-lg"
          />
          <SyncBadge />
        </div>
      </div>
    </Section>
  )
}
