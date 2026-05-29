import { getLvl, getNext, getLvlPct } from '@/data/levels'
import { LevelBadge } from '@/components/LevelBadge'

/** Level badge + XP-to-next progress bar (ported from xpBar). */
export function XpBar({ xp }: { xp: number }) {
  const cur = getLvl(xp)
  const next = getNext(xp)
  const prog = getLvlPct(xp)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <LevelBadge level={cur} />
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
          {next
            ? `${xp.toLocaleString()} / ${next.xpNeeded.toLocaleString()} XP to ${next.title}`
            : `Max level! ${xp.toLocaleString()} XP`}
        </span>
      </div>
      <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${prog}%`, background: cur.color, borderRadius: '3px', transition: 'width 0.6s' }} />
      </div>
    </div>
  )
}
