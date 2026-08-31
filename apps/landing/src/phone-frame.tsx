import { cn } from "@doska/ui-kit"
import { SyncBadge } from "./sync-badge"

export function PhoneFrame({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) {
  return (
    <div className={cn("relative shrink-0", className)}>
      <span className="absolute top-[14%] -left-[2px] h-[3%] w-[3px] rounded-l-sm bg-neutral-700" />
      <span className="absolute top-[20%] -left-[2px] h-[6%] w-[3px] rounded-l-sm bg-neutral-700" />
      <span className="absolute top-[28%] -left-[2px] h-[6%] w-[3px] rounded-l-sm bg-neutral-700" />
      <span className="absolute top-[24%] -right-[2px] h-[9%] w-[3px] rounded-r-sm bg-neutral-700" />
      <div className="h-full overflow-hidden rounded-t-[2.4rem] bg-neutral-900 px-[9px] pt-[9px] shadow-2xl ring-1 ring-white/15 ring-inset">
        <div className="relative h-full overflow-hidden rounded-t-[1.9rem] bg-[#232939] pt-6">
          <img
            src={src}
            alt={alt}
            className="block h-full w-full object-cover object-top"
          />
          <span className="absolute top-1 left-1/2 h-[16px] w-[68px] -translate-x-1/2 rounded-full bg-black" />
          <SyncBadge />
        </div>
      </div>
    </div>
  )
}
