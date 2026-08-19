import { Text, cn } from "@doska/ui-kit-mobile"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import Constants from "expo-constants"
import Anchor from "lucide-react-native/icons/anchor"
import { View } from "react-native"

export function SidebarHeader() {
  const tokens = useTokens()

  return (
    <View className="flex-row items-center gap-2 px-4 py-3 relative">
      <Anchor size={20} color={tokens.foreground} />
      <Text className="text-xl font-sans-semibold text-sidebar-foreground">
        Doska
      </Text>
      <Text
        className={cn(
          "text-footnote text-muted-foreground font-mono",
          "absolute right-4 w-40 line-clamp-1"
        )}
      >
        {Constants.expoConfig?.extra?.appVersion ?? ""}
      </Text>
    </View>
  )
}
