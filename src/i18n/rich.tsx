import type { CSSProperties, ReactNode } from 'react'
import { t } from '@/i18n'

/**
 * Inline markup for translated prose: `**bold**` and `*emphasis*`.
 *
 * Guidance copy leans on emphasis to carry meaning ("how much their work
 * *changes*"), and splitting a sentence into three dictionary entries so the
 * middle one can be italic gives translators fragments they can't reorder.
 * Keeping the whole sentence as one entry, with the emphasis marked inline,
 * lets them move the markers wherever their language needs them.
 */
export function renderRich(text: string, strongStyle?: CSSProperties): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4)
      return (
        <strong key={i} style={strongStyle}>
          {part.slice(2, -2)}
        </strong>
      )
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2)
      return <em key={i}>{part.slice(1, -1)}</em>
    return part
  })
}

/** Translate a source string and render its inline emphasis markers. */
export function tr(source: string, strongStyle?: CSSProperties): ReactNode {
  return renderRich(t(source), strongStyle)
}
