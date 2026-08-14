import { Button, Menu, MenuContent, MenuItem, MenuTrigger } from "@doska/ui-kit"
import { CalendarClock, Check, ListFilter, Triangle } from "lucide-react"

interface IProps {
  sort: string[]
  onChangeSort: (sort: string[]) => void
}

export function SortMenu({ sort, onChangeSort }: IProps) {
  function toggleSort(key: string) {
    if (sort.includes(key)) {
      onChangeSort(sort.filter((k) => k !== key))
    } else {
      onChangeSort([...sort, key])
    }
  }

  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Sort cards"
            className={
              sort.length
                ? "bg-primary/10 text-primary hover:bg-primary/15 dark:hover:bg-primary/15"
                : "text-muted-foreground"
            }
          />
        }
      >
        <ListFilter />
      </MenuTrigger>
      <MenuContent>
        <MenuItem closeOnClick={false} onClick={() => toggleSort("priority")}>
          <Triangle />
          Sort by priority
          {sort.includes("priority") && <Check className="ml-auto" />}
        </MenuItem>
        <MenuItem closeOnClick={false} onClick={() => toggleSort("deadline")}>
          <CalendarClock />
          Sort by date
          {sort.includes("deadline") && <Check className="ml-auto" />}
        </MenuItem>
      </MenuContent>
    </Menu>
  )
}
