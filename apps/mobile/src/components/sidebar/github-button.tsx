import ExternalLink from "lucide-react-native/icons/external-link"
import { Linking } from "react-native"
import { SidebarButton } from "./sidebar-button"

const REPO = "https://github.com/apezio/doska"

/** Sidebar entry linking to the project repository. */
export function GitHubButton() {
  return (
    <SidebarButton
      icon={ExternalLink}
      label="GitHub"
      onPress={() => void Linking.openURL(REPO)}
    />
  )
}
