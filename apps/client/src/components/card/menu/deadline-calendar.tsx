import { Calendar } from "@doska/ui-kit"

export default function DeadlineCalendar({
  value,
  onSelect,
}: {
  value: string | null
  onSelect: (value: string | null) => void
}) {
  return (
    <Calendar
      mode="single"
      selected={isoToDate(value)}
      onSelect={(date) => onSelect(date ? dateToIso(date) : null)}
      className="bg-transparent"
    />
  )
}

function isoToDate(value: string | null) {
  if (!value) return undefined
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function dateToIso(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}
