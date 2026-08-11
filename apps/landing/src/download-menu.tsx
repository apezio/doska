import { useEffect, useState } from "react"
import { Button, Menu, MenuContent, MenuItem, MenuTrigger } from "@doska/ui-kit"
import { ChevronDown } from "lucide-react"
import { SiApple, SiGithub } from "react-icons/si"
import { releasesLatest, repoApi } from "./links"

type GhRelease = { assets?: { name: string; browser_download_url: string }[] }

/**
 * Direct download URL for the newest stable release's .dmg
 */
function useLatestDmg(): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`${repoApi}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((res) => (res.ok ? (res.json() as Promise<GhRelease>) : null))
      .then((release) => {
        if (cancelled) return
        const dmg = release?.assets?.find((a) => a.name.endsWith(".dmg"))
        if (dmg) setUrl(dmg.browser_download_url)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return url
}

export function DownloadMenu() {
  const dmg = useLatestDmg()

  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant="outline"
            size="lg"
            className="h-11 w-full gap-2 px-5 text-base sm:w-auto"
          />
        }
      >
        <SiApple className="size-4" />
        Download for macOS
        <ChevronDown className="size-4 text-muted-foreground" />
      </MenuTrigger>
      <MenuContent align="start">
        <MenuItem
          className="plausible-event-name=CTA+Download+macOS"
          render={
            <a href={dmg ?? releasesLatest} target="_blank" rel="noreferrer" />
          }
        >
          <SiApple />
          Download macOS app
        </MenuItem>
        <MenuItem
          className="plausible-event-name=CTA+Download+GitHub"
          render={<a href={releasesLatest} target="_blank" rel="noreferrer" />}
        >
          <SiGithub />
          Download from GitHub Releases
        </MenuItem>
      </MenuContent>
    </Menu>
  )
}
