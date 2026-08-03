import { createElement, Fragment, type MouseEvent } from "react"
import { Checkbox } from "@doska/ui-kit"
import { toAttachmentSrc } from "@doska/markdown"
import type { MarkdownAdapter, MarkdownRenderers } from "@doska/markdown"

function stopPropagation(event: MouseEvent) {
  event.stopPropagation()
}

/**
 * The DOM half of the renderer. It emits the same elements and class names the
 * old react-markdown pipeline did, so `markdown.css` styles it unchanged.
 */
export function createWebAdapter({
  renderImage,
  renderWikilink,
}: MarkdownRenderers): MarkdownAdapter {
  return {
    // ----------------------------------------------------------- blocks
    paragraph(runs, style, key) {
      const content = runs.flatMap((run) =>
        run.kind === "inline" ? run.children : [run.node]
      )
      // A tight list item's paragraph wrapper would add `.markdown p` margins
      // the HTML pipeline never produced.
      if (style.tight) return <Fragment key={key}>{content}</Fragment>
      return <p key={key}>{content}</p>
    },

    heading(depth, children, key) {
      return createElement(`h${Math.min(depth, 6)}`, { key }, children)
    },

    list(ordered, start, items, key) {
      if (ordered)
        return (
          <ol key={key} start={start === 1 ? undefined : start}>
            {items}
          </ol>
        )
      return <ul key={key}>{items}</ul>
    },

    listItem(marker, blocks, key) {
      if (marker.kind !== "task") return <li key={key}>{blocks}</li>
      return (
        <li key={key} className="task-list-item">
          <span className="contents" onClick={stopPropagation}>
            <Checkbox
              aria-label="Checkbox"
              checked={marker.checked}
              readOnly={!marker.onToggle}
              className={`-mt-0.5 mr-1.5 inline-flex align-middle${
                marker.onToggle ? "cursor-pointer" : ""
              }`}
              onCheckedChange={marker.onToggle}
            />
          </span>
          {blocks}
        </li>
      )
    },

    blockquote(blocks, key) {
      return <blockquote key={key}>{blocks}</blockquote>
    },

    code(value, lang, key) {
      return (
        <pre key={key}>
          <code className={lang ? `language-${lang}` : undefined}>{value}</code>
        </pre>
      )
    },

    thematicBreak(key) {
      return <hr key={key} />
    },

    table(head, body, key) {
      return (
        <table key={key}>
          {head && <thead>{head}</thead>}
          <tbody>{body}</tbody>
        </table>
      )
    },

    tableRow(cells, _header, key) {
      return <tr key={key}>{cells}</tr>
    },

    tableCell(children, cell, key) {
      const style = cell.align ? { textAlign: cell.align } : undefined
      if (cell.header)
        return (
          <th key={key} style={style}>
            {children}
          </th>
        )
      return (
        <td key={key} style={style}>
          {children}
        </td>
      )
    },

    html(value, key) {
      return (
        <code key={key} className="raw-html">
          {value}
        </code>
      )
    },

    footnoteDefinition(label, blocks, key) {
      return (
        <div key={key} className="footnote-def">
          <span className="footnote-label">{label}</span>
          {blocks}
        </div>
      )
    },

    // ----------------------------------------------------------- inline
    text(value) {
      return value
    },

    lineBreak(key) {
      return <br key={key} />
    },

    strong(children, key) {
      return <strong key={key}>{children}</strong>
    },

    emphasis(children, key) {
      return <em key={key}>{children}</em>
    },

    strikethrough(children, key) {
      return <del key={key}>{children}</del>
    },

    mark(children, key) {
      return <mark key={key}>{children}</mark>
    },

    inlineCode(value, key) {
      return <code key={key}>{value}</code>
    },

    link(url, children, key) {
      return (
        <a
          key={key}
          href={url}
          onClick={stopPropagation}
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      )
    },

    image(source, alt, _position, key) {
      if (source.kind === "attachment") {
        const custom = renderImage?.(source.key, alt)
        if (custom) return <Fragment key={key}>{custom}</Fragment>
        return (
          <img
            key={key}
            src={toAttachmentSrc(source.key)}
            alt={alt}
            loading="lazy"
          />
        )
      }
      return <img key={key} src={source.url} alt={alt} loading="lazy" />
    },

    wikilink(target, key) {
      const custom = renderWikilink?.(target)
      if (custom) return <Fragment key={key}>{custom}</Fragment>
      return (
        <span key={key} className="wikilink">
          {target}
        </span>
      )
    },

    tag(color, text, key) {
      return (
        <span key={key} className="tag" data-tag-color={color}>
          {text}
        </span>
      )
    },

    cut(key) {
      return <span key={key} className="cut-divider" />
    },

    footnoteReference(label, key) {
      return (
        <sup key={key} className="footnote-ref">
          {label}
        </sup>
      )
    },
  }
}
