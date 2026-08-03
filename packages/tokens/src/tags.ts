export interface TagColor {
  lightBg: string
  lightFg: string
  darkBg: string
  darkFg: string
}

/**
 * The `[tag]` pill palette as sRGB, mirroring the `[data-tag-color]` rules in
 * `markdown.css` — the web states them in `oklch()`, which React Native's color
 * parser does not accept. Change the CSS and these have to be regenerated.
 *
 * Index is the slot `remarkTags` assigns; the length must stay
 * `TAG_COLOR_COUNT`.
 */
export const TAG_PALETTE: TagColor[] = [
  {
    lightBg: "#fbeec9",
    lightFg: "#7c5700",
    darkBg: "#a781003d",
    darkFg: "#e6c873",
  },
  {
    lightBg: "#c9f8ff",
    lightFg: "#007591",
    darkBg: "#009ab73d",
    darkFg: "#68def4",
  },
  {
    lightBg: "#cef5ff",
    lightFg: "#005b92",
    darkBg: "#0092cc3d",
    darkFg: "#68c3f2",
  },
  {
    lightBg: "#d7f2ff",
    lightFg: "#1b6ab6",
    darkBg: "#3e89d73d",
    darkFg: "#9bd6ff",
  },
  {
    lightBg: "#e1eeff",
    lightFg: "#314398",
    darkBg: "#667fda3d",
    darkFg: "#9cb4fe",
  },
  {
    lightBg: "#eceaff",
    lightFg: "#6758b4",
    darkBg: "#8376d53d",
    darkFg: "#cdc6ff",
  },
  {
    lightBg: "#f7e7ff",
    lightFg: "#603288",
    darkBg: "#9b6dc83d",
    darkFg: "#c9a5ef",
  },
  {
    lightBg: "#ffe4ff",
    lightFg: "#8f4896",
    darkBg: "#af66b53d",
    darkFg: "#f5b8fa",
  },
  {
    lightBg: "#ffe2f8",
    lightFg: "#832a68",
    darkBg: "#be619e3d",
    darkFg: "#ec9ece",
  },
  {
    lightBg: "#ffe1ee",
    lightFg: "#a54069",
    darkBg: "#c75e863d",
    darkFg: "#ffafcd",
  },
]

export function tagColor(index: number): TagColor {
  return TAG_PALETTE[index % TAG_PALETTE.length]
}
