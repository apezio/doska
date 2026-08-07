import BookOpen from "lucide-react-native/icons/book-open"
import { Linking } from "react-native"
import { SidebarButton } from "./sidebar-button"

const DOCS = "https://doska.sh/docs"

/** Sidebar entry linking to the documentation site. */
export function DocsButton() {
  return (
    <SidebarButton
      icon={BookOpen}
      label="Docs"
      onPress={() => void Linking.openURL(DOCS)}
    />
  )
}
