import { useTokens } from "@doska/ui-kit-mobile/tokens"
import { Text, View } from "react-native"
import Svg, { Circle, Path } from "react-native-svg"

interface IProps {
  done: number
  total: number
}

// Mirrors the web's `TaskIndicator` geometry so the two read as one control.
const VIEWBOX = 16
const STROKE = 2
const RADIUS = (VIEWBOX - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const CENTER = VIEWBOX / 2
const SIZE = 14

export function TaskCount({ done, total }: IProps) {
  const { mutedForeground } = useTokens()

  const complete = total > 0 && done === total
  const progress = total === 0 ? 0 : done / total

  return (
    <View className="flex-row items-center gap-1">
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          stroke={mutedForeground}
          opacity={0.3}
        />
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          stroke={mutedForeground}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          // Starts the arc at 12 o'clock instead of 3.
          origin={`${CENTER}, ${CENTER}`}
          rotation={-90}
        />
        {complete && (
          <Path
            d="M4.8 8.2 L7 10.4 L11.2 6"
            fill="none"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke={mutedForeground}
          />
        )}
      </Svg>
      <Text className="font-mono text-xs text-muted-foreground">
        {done}/{total}
      </Text>
    </View>
  )
}
