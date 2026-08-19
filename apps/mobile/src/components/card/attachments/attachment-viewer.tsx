import { attachmentUnavailable } from "@doska/core/attachment-labels"
import { useCard } from "@doska/core/queries"
import { useConnection } from "@doska/core/sync"
import { IconButton, Text } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import Share2 from "lucide-react-native/icons/share-2"
import X from "lucide-react-native/icons/x"
import { useState } from "react"
import { Image, Share, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { AttachmentUnavailable } from "./attachment-unavailable"
import { useAttachmentUri } from "./use-attachment-uri"

interface IProps {
  cardId: string
  attachmentId: string
}

/** One attachment, full screen: the mobile form of the web's lightbox. */
export function AttachmentViewer({ cardId, attachmentId }: IProps) {
  const insets = useSafeAreaInsets()
  const connection = useConnection()
  const { data: card } = useCard(cardId)
  const [error, setError] = useState("")

  const attachment = card?.attachments?.find((a) => a.id === attachmentId)
  const { uri, unavailable } = useAttachmentUri(
    cardId,
    attachment?.key ?? "",
    attachment?.name ?? ""
  )

  async function share() {
    if (!uri || !attachment) return
    setError("")
    try {
      await Share.share({ url: uri, title: attachment.name })
    } catch {
      setError(attachmentUnavailable(connection))
    }
  }

  return (
    <View className="flex-1 bg-card" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-2 border-b border-muted px-3 py-2">
        <Text
          numberOfLines={1}
          className="flex-1 text-subheadline font-sans-semibold text-card-foreground"
        >
          {attachment?.name ?? "File"}
        </Text>
        <IconButton
          icon={Share2}
          label="Share"
          disabled={!uri}
          onPress={() => void share()}
        />
        <IconButton icon={X} label="Close" onPress={() => router.back()} />
      </View>

      {!!error && (
        <Text className="border-b border-muted px-3 py-2 text-footnote text-destructive">
          {error}
        </Text>
      )}

      <View className="flex-1 items-center justify-center p-3">
        {!!uri && (
          <Image
            source={{ uri }}
            accessibilityLabel={attachment?.name}
            resizeMode="contain"
            style={{ flex: 1, width: "100%" }}
          />
        )}
        {!uri && unavailable && <AttachmentUnavailable className="w-full" />}
      </View>
    </View>
  )
}
