export function AccountTag({ children }: React.PropsWithChildren) {
  return (
    <span className="rounded border px-1 text-[0.7rem] text-muted-foreground">
      {children}
    </span>
  )
}
