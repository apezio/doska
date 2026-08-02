import { cn } from "@doska/ui-kit"
import { useRef, type ReactNode } from "react"
import {
  toggleTaskByIndex,
  useMarkers,
  type Marker,
  type SlashCommand,
  type WikilinkOption,
} from "@doska/markdown"
import { useCutLine } from "./hooks/use-cut-line"
import { useListContinuation } from "./hooks/use-list-continuation"
import { usePasteFiles } from "./hooks/use-paste-files"
import { useCaretScroll } from "./hooks/use-caret-scroll"
import { SlashMenu } from "./slash-menu/slash-menu"
import { WikilinkMenu } from "./wikilink-menu"

interface PreviewProps {
  /** The body with markers already applied. */
  children: string
  className?: string
  /** Absent when the caller passed no `onToggleTask`. */
  onToggleTask?: (index: number) => void
}

interface IProps extends React.ComponentProps<"textarea"> {
  isPreview?: boolean
  /**
   * Draws the preview. Rendering markdown is the app's job — it owns the
   * adapter that turns the parsed body into its own components.
   */
  renderPreview: (props: PreviewProps) => ReactNode
  value?: string
  markers?: Marker[]
  onToggleTask?: (value: string) => void
  /** Enables the `/` slash command menu. Off by default. */
  slashMenu?: boolean
  /** Overrides the default slash commands. */
  slashCommands?: SlashCommand[]
  /** Required when `slashMenu` is on, to apply inserted commands. */
  onChangeValue?: (value: string) => void
  /** Targets the `[[` wikilink menu can offer. Omit to disable the menu. */
  wikilinks?: WikilinkOption[]
  /** Persists pasted files; returns Markdown to splice at the caret, or null. */
  onPasteFiles?: (files: File[]) => Promise<string | null>
  containerClassName?: string
  /**
   * Where the mobile slash button renders. Must be a non-scrolling ancestor, or
   * the button scrolls away with the text.
   */
  overlayContainer?: HTMLElement | null
}

const NO_MARKERS: Marker[] = []
const NOOP = () => {}

export function MarkdownTextarea({
  isPreview,
  renderPreview,
  markers = NO_MARKERS,
  onToggleTask,
  slashMenu,
  slashCommands,
  onChangeValue,
  wikilinks,
  onPasteFiles,
  containerClassName,
  overlayContainer,
  ...props
}: IProps) {
  const value = typeof props.value === "string" ? props.value : ""
  const { body } = useMarkers(value, markers, "preview")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useCutLine(textareaRef, {
    value,
    onChangeValue: onChangeValue ?? NOOP,
    enabled: !isPreview && Boolean(onChangeValue),
  })

  useListContinuation(textareaRef, {
    value,
    onChangeValue: onChangeValue ?? NOOP,
    enabled: !isPreview && Boolean(onChangeValue),
  })

  useCaretScroll(textareaRef, !isPreview)

  const handlePaste = usePasteFiles(textareaRef, {
    value,
    onChangeValue: onChangeValue ?? NOOP,
    onPasteFiles,
  })

  if (isPreview)
    return (
      <div className={cn("space-y-4 pt-3 select-text", containerClassName)}>
        {body &&
          renderPreview({
            children: body,
            className: props.className,
            onToggleTask: onToggleTask
              ? (index) => onToggleTask(toggleTaskByIndex(value, index))
              : undefined,
          })}
      </div>
    )
  return (
    <div
      className={cn(
        "relative flex min-h-0 w-full flex-col",
        containerClassName
      )}
    >
      <textarea
        {...props}
        ref={textareaRef}
        onPaste={handlePaste}
        className={cn(
          "w-full resize-none bg-transparent outline-none",
          "placeholder:text-muted-foreground/50",
          "py-2 font-mono",
          "text-base leading-relaxed [font-variant-ligatures:none]",
          "field-sizing-content",
          props.className
        )}
      />
      {slashMenu && (
        <SlashMenu
          textareaRef={textareaRef}
          value={value}
          onChangeValue={onChangeValue ?? NOOP}
          commands={slashCommands}
          overlayContainer={overlayContainer}
        />
      )}
      {wikilinks && wikilinks.length > 0 && (
        <WikilinkMenu
          textareaRef={textareaRef}
          value={value}
          onChangeValue={onChangeValue ?? NOOP}
          options={wikilinks}
        />
      )}
    </div>
  )
}
