import { IconButton, TextField } from "@doska/ui-kit-mobile"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import SearchIcon from "lucide-react-native/icons/search"
import X from "lucide-react-native/icons/x"
import { Pressable, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

interface IProps {
  value: string
  onChangeText: (value: string) => void
  onCancel: () => void
}

/** The search screen's own top bar: the field stands in for a title, so the
 * modal needs no navigation header of its own. */
export function SearchField({ value, onChangeText, onCancel }: IProps) {
  const insets = useSafeAreaInsets()
  const tokens = useTokens()

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="shrink-0 border-b border-sidebar-border bg-sidebar"
    >
      <View className="h-[46px] flex-row items-center gap-2 px-3">
        <View className="min-w-0 flex-1 flex-row items-center gap-2 rounded-lg bg-muted px-2">
          <SearchIcon size={16} color={tokens.mutedForeground} />
          <TextField
            value={value}
            onChangeText={onChangeText}
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
            returnKeyType="search"
            placeholder="Search cards"
            accessibilityLabel="Search cards"
            className="min-w-0 flex-1 py-1.5 text-base text-foreground"
          />
          {value !== "" && (
            <IconButton
              icon={X}
              variant="plain"
              size={16}
              label="Clear search"
              onPress={() => onChangeText("")}
            />
          )}
        </View>
        <Pressable
          onPress={onCancel}
          hitSlop={8}
          accessibilityRole="button"
          className="active:opacity-40"
        >
          <Text className="px-1 text-[15px] font-sans-medium text-primary">
            Cancel
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
