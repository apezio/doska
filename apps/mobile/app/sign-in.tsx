import { useLogin, useLogout } from "@doska/core/mutations"
import { useSession } from "@doska/core/queries"
import { useRouter } from "expo-router"
import { useState } from "react"
import { Pressable, ScrollView, Text, TextInput, View } from "react-native"
import { getServerUrl, setServerUrl } from "@/lib/adapters/server-url"
import { useTokens } from "@/lib/tokens"

export default function SignInScreen() {
  const { data: session } = useSession()

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 p-4"
      keyboardShouldPersistTaps="handled"
    >
      {session?.authed ? <SignedIn login={session.login} /> : <SyncSetup />}
    </ScrollView>
  )
}

function SignedIn({ login }: { login: string | null }) {
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

function SyncSetup() {
  const router = useRouter()
  const [server, setServer] = useState(getServerUrl)
  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const { mutate, isPending, isError } = useLogin()

  function submit() {
    // There is no same-origin server to fall back on, so the URL has to be
    // stored before signing in — that is what tells the auth call where to go.
    setServerUrl(server)
    mutate(
      { login, password },
      {
        onSuccess: () => {
          setPassword("")
          router.back()
        },
      }
    )
  }

  return (
    <View className="gap-4">
      <View className="gap-1">
        <Text className="text-xl font-sans-semibold text-card-foreground">
          Set up sync
        </Text>
        <Text className="text-[13px] text-muted-foreground">
          Your boards stay on this device until you set up sync.
        </Text>
      </View>

      <View className="gap-2">
        <Field
          value={server}
          onChangeText={setServer}
          placeholder="Server URL (https://…)"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          textContentType="URL"
        />
        <Field
          value={login}
          onChangeText={setLogin}
          placeholder="Login"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
        />
        <Field
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          textContentType="password"
          onSubmitEditing={submit}
        />
        {isError && (
          <Text className="text-xs text-destructive">Invalid credentials.</Text>
        )}
      </View>

      <Button
        label={isPending ? "Signing in..." : "Sign in"}
        disabled={isPending || !server.trim() || !login || !password}
        onPress={submit}
      />
    </View>
  )
}

function Field(props: React.ComponentProps<typeof TextInput>) {
  const tokens = useTokens()

  return (
    <TextInput
      className="rounded-xl border border-border bg-card px-3 py-3 text-[15px] text-card-foreground"
      placeholderTextColor={tokens.mutedForeground}
      {...props}
    />
  )
}

function Button({
  label,
  disabled,
  onPress,
}: {
  label: string
  disabled?: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className={
        disabled
          ? "items-center rounded-xl bg-primary/40 px-4 py-3"
          : "items-center rounded-xl bg-primary px-4 py-3 active:bg-blue-700"
      }
    >
      <Text className="text-[15px] font-sans-medium text-primary-foreground">
        {label}
      </Text>
    </Pressable>
  )
}
