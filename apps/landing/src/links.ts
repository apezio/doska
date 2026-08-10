/** Dev points at the local client, so the CTA opens the board you're editing. */
const appOrigin = import.meta.env.DEV
  ? "http://localhost:5173"
  : "https://app.doska.sh"

export const app = `${appOrigin}/d/welcome`
export const author = "https://github.com/romenkova"
export const repo = `${author}/doska`
export const releases = `${repo}/releases`
export const roadmap = "https://app.doska.sh/p/2af2848df270cb5b8a4e73e7a362b19b"
