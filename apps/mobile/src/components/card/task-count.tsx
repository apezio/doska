import { Text, View } from "react-native"

interface IProps {
  done: number
  total: number
}

export function TaskCount({ done, total }: IProps) {
  return (
    <View className="flex-row items-center gap-1">
      <View
        className={
          done === total
            ? "size-3.5 rounded-full border-[3px] border-muted-foreground"
            : "size-3.5 rounded-full border border-muted-foreground"
        }
      />
      <Text className="font-mono text-xs text-muted-foreground">
        {done}/{total}
      </Text>
    </View>
  )
}
