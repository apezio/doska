export function BottomBadges() {
  return (
    <div className="flex w-full justify-end p-4">
      <a
        href="https://self-hosted.directory"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src="https://self-hosted.directory/badge-dark.svg"
          alt="Featured on Self-Hosted.Directory"
          width="133"
          height="36"
          className="h-9 w-auto"
        />
      </a>
    </div>
  )
}
