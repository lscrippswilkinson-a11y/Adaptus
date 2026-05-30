import type { StageId } from '@/types'
import { TIPS } from '@/data/tips'

/** Educational tip banner for a stage (ported from mkTip). */
export function TipBox({ stageId }: { stageId: StageId }) {
  const tip = TIPS[stageId]
  if (!tip) return null
  return (
    <div className="tip-box" style={{ background: tip.color, border: `1px solid ${tip.border}` }}>
      <div className="tip-hdr">
        <span style={{ fontSize: '16px' }}>{tip.icon}</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(var(--fg),0.85)' }}>{tip.title}</span>
      </div>
      {/* Static, trusted markup from data/tips.ts */}
      <div className="tip-body" dangerouslySetInnerHTML={{ __html: tip.body }} />
    </div>
  )
}
