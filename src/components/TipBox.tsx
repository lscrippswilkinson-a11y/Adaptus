import type { StageId } from '@/types'
import { TIPS } from '@/data/tips'
import { useT } from '@/i18n/LanguageContext'

/** Educational tip banner for a stage (ported from mkTip). */
export function TipBox({ stageId }: { stageId: StageId }) {
  const t = useT()
  const tip = TIPS[stageId]
  if (!tip) return null
  return (
    <div className="tip-box" style={{ background: tip.color, border: `1px solid ${tip.border}` }}>
      <div className="tip-hdr">
        <span style={{ fontSize: '16px' }}>{tip.icon}</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(var(--fg),0.85)' }}>{t(tip.title)}</span>
      </div>
      {/* Static, trusted markup from data/tips.ts. Translated as one whole
          string: the body is a block of markup, and splitting it into per-run
          entries would hand translators unorderable fragments. Locale files are
          authored in-repo, so the trusted-markup guarantee still holds. */}
      <div className="tip-body" dangerouslySetInnerHTML={{ __html: t(tip.body) }} />
    </div>
  )
}
