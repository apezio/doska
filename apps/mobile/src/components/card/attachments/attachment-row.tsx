import { isRenderableImage } from "@doska/core/attachment-mime"
import type { Attachment } from "@doska/core/types"
import { IconButton, Text } from "@doska/ui-kit-mobile"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import FileText from "lucide-react-native/icons/file-text"
import ImageIcon from "lucide-react-native/icons/image"
import X from "lucide-react-native/icons/x"
import { Pressable, View } from "react-native"

interface IProps {
  attachment: Attachment
  onPress: () => void
  /** Omit to make the row read-only. */
  onRemove?: () => void
}

/**
 * One attachment as a named row. No thumbnail: drawing one would download
 * every attachment on the board, and the bytes are only worth fetching for a
 * tile someone opens or a body image that asked for them.
 */
export function AttachmentRow({ attachment, onPress, onRemove }: IProps) {
  const tokens = useTokens()
  const Glyph = isRenderableImage(attachment.mime) ? ImageIcon : FileText

  return (
    <View className="flex-row items-center gap-1">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={attachment.name}
        className="flex-1 flex-row items-center gap-2 rounded-md py-1 active:opacity-60"
      >
        <Glyph size={16} color={tokens.mutedForeground} />
        <Text
          numberOfLines={1}
          className="flex-1 text-footnote text-muted-foreground"
        >
          {attachment.name}
        </Text>
      </Pressable>
      {!!onRemove && (
        <IconButton
          icon={X}
          label={`Remove ${attachment.name}`}
          size={16}
          onPress={onRemove}
        />
      )}
    </View>
  )
}
