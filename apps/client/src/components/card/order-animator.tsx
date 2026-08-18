import { motion } from "motion/react"
import type { ReactNode } from "react"
import { useIsBoardDragging } from "../deck/drag-state"

export function OrderAnimator({ children }: { children: ReactNode }) {
  const isDragging = useIsBoardDragging()

  return (
    <motion.div
      layout={isDragging ? false : "position"}
      transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
    >
      {children}
    </motion.div>
  )
}
