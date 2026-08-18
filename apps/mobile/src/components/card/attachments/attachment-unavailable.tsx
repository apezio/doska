import { attachmentUnavailable } from "@doska/core/attachment-labels"
import { useConnection } from "@doska/core/sync"
import { Text, View } from "react-native"

/** Stands in for an attachment that didn't load, and says why. */
export function AttachmentUnavailable({ className }: { className?: string }) {
  const connection = useConnection()
  const message = attachmentUnavailable(connection)

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={message}
      className={`items-center justify-center rounded-lg border border-dashed border-border bg-muted p-4 ${className ?? ""}`}
    >
      <Text className="text-center text-xs text-muted-foreground">
        {message}
      </Text>
    </View>
  )
}
