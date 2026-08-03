import Moon from "lucide-react-native/icons/moon"
import Sun from "lucide-react-native/icons/sun"
import { useTheme } from "@/lib/theme"
import { SidebarButton } from "./sidebar-button"

const THEME_ICON = { light: Sun, dark: Moon }
const THEME_LABEL = { light: "Light theme", dark: "Dark theme" }

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <SidebarButton
      icon={THEME_ICON[theme]}
      label={THEME_LABEL[theme]}
      onPress={() => setTheme(theme === "dark" ? "light" : "dark")}
    />
  )
}
