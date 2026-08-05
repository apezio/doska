import type { MouseEvent } from "react"
import { cn } from "../lib/cn"

/** Images and GIFs fit the body's width, whatever they are. */
export function MdImage({
  src,
  alt,
  className,
  onClick,
}: {
  src: string
  alt: string
  className?: string
  onClick?: (event: MouseEvent<HTMLImageElement>) => void
}) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onClick={onClick}
      className={cn("my-4 block h-auto max-w-full rounded-lg", className)}
    />
  )
}
