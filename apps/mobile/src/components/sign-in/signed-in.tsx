import { useLogout } from "@doska/core/mutations"
import { Button, Text } from "@doska/ui-kit-mobile"
import { View } from "react-native"
import { getServerUrl } from "@doska/core/server"

interface IProps {
  login: string | null
}

export function SignedIn({ login }: IProps) {
  const { mutate: logout, isPending } = useLogout()

  return (
    <View className="gap-4">
      <View className="gap-1">
        <Text className="text-xl font-sans-semibold text-card-foreground">
          Sync is on
        </Text>
        <Text className="text-[13px] text-muted-foreground">
          Signed in{login ? ` as ${login}` : ""} to {getServerUrl()}.
        </Text>
      </View>

      <Button
        label={isPending ? "Signing out..." : "Sign out"}
        disabled={isPending}
        onPress={() => logout()}
      />
    </View>
  )
}
