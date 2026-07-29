import type { ReactNode } from 'react'
import { useT } from '@/i18n/LanguageContext'

/**
 * Renders a translated sentence that has one React node embedded in it (a bold
 * run, a link, a live number). The sentence stays a single dictionary entry
 * with a `{slot}` marker, so translators keep control of word order instead of
 * being handed two half-sentences that only compose in English.
 */
export function TSplit({ source, slot, node }: { source: string; slot: string; node: ReactNode }) {
  const t = useT()
  const [before, ...rest] = t(source).split(slot)
  return (
    <>
      {before}
      {node}
      {rest.join(slot)}
    </>
  )
}
