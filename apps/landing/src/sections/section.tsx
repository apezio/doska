import type { ReactNode } from "react"

export function SectionHeading({
  title,
  subtitle,
}: {
  title: string
  subtitle?: ReactNode
}) {
  return (
    <>
      <h2 className="max-w-2xl text-3xl font-extrabold">{title}</h2>
      {subtitle && (
        <p className="mt-2 max-w-lg text-muted-foreground">{subtitle}</p>
      )}
    </>
  )
}

export function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
      <SectionHeading title={title} subtitle={subtitle} />
      <div className="mt-8">{children}</div>
    </section>
  )
}
