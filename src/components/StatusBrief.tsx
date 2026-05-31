import type { Project } from '@/types'
import { avgRisk, preparedness, riskColor, riskLabel } from '@/lib/format'

/**
 * The forwardable artifact: a forward-looking, exec-shaped status brief derived
 * from a project's stage data. Structured around the four questions a busy
 * leader scans for — Are we on track? What could go wrong? Who's on board? What
 * do you need from me? — plus an adoption snapshot. Rendered both in the in-app
 * share preview and on the public, no-login share page (`publicView`).
 */

const longDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
const prepColor = (p: number) => (p >= 80 ? '#22c55e' : p >= 50 ? '#f59e0b' : '#ef4444')
const statusWord = (p: number) => (p >= 80 ? 'On track' : p >= 50 ? 'At risk' : 'Needs attention')

/** Normalise a risk item's likelihood × impact (each 1–3) to a 1–10 score. */
const itemScore = (likelihood: number, impact: number) => Math.round((likelihood * impact) / 9 * 10 * 10) / 10
const sevClass = (score: number) => (score <= 3 ? 'g' : score <= 6 ? 'a' : 'r')

export function StatusBrief({ project, publicView = false }: { project: Project; publicView?: boolean }) {
  const sd = project.stageData
  const prep = preparedness(project)
  const avg = avgRisk(sd.risk.items)

  const goLive = sd.milestones.goLiveDate
    ? new Date(sd.milestones.goLiveDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : project.targetDate || '—'

  const topRisks = sd.risk.items
    .filter((r) => r.description.trim())
    .map((r) => ({ ...r, score: itemScore(r.likelihood, r.impact) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const named = sd.stakeholders.rows.filter((r) => r.name.trim())
  const advocates = named.filter((r) => r.support === 'Advocate').length
  const resistant = named.filter((r) => r.support === 'Resistant').length

  const metrics = sd.adoption.metrics.filter((m) => m.name.trim())
  const ask = sd.executive.ask?.trim()

  return (
    <div className="brief-wrap">
      <div className="brief-hdr">
        <div className="brief-badge" style={{ borderColor: 'rgba(255,255,255,0.35)' }}>
          {statusWord(prep.pct)} · {prep.pct}% ready
        </div>
        <h1>{project.name || 'Change initiative'}</h1>
        <div className="bm">{project.type || 'Change initiative'} · Status Brief · {longDate(new Date())}</div>
      </div>

      <div className="brief-body">
        {/* 1 — Are we on track? */}
        <div className="bs">
          <div className="bst">Are we on track?</div>
          <div className="bsg">
            <div className="bsc"><div className="v" style={{ color: prepColor(prep.pct) }}>{prep.pct}%</div><div className="l">Launch ready</div></div>
            <div className="bsc"><div className="v">{goLive}</div><div className="l">Go-live</div></div>
            <div className="bsc"><div className="v">{prep.total ? `${prep.done}/${prep.total}` : '—'}</div><div className="l">Tasks done</div></div>
          </div>
        </div>

        {/* 2 — What could go wrong? */}
        <div className="bs">
          <div className="bst">Top risks to watch</div>
          {topRisks.length ? (
            topRisks.map((r) => (
              <div key={r.id} className="bai">
                <div className="bad" style={{ background: riskColor(r.score) }} />
                <div style={{ flex: 1 }}>
                  {r.description}
                  <span className={`btag ${sevClass(r.score)}`} style={{ marginLeft: '8px' }}>{riskLabel(r.score)}</span>
                </div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>No risks logged yet.</div>
          )}
        </div>

        {/* 3 — Who's on board? */}
        <div className="bs">
          <div className="bst">Who’s on board?</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.78)', lineHeight: 1.7 }}>
            {sd.sponsor.name ? (
              <>Sponsor: <strong style={{ color: '#fff' }}>{sd.sponsor.name}</strong>{sd.sponsor.role ? ` (${sd.sponsor.role})` : ''}</>
            ) : (
              <span style={{ color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>No sponsor named yet</span>
            )}
          </div>
          {named.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <span className="btag g">{advocates} advocate{advocates === 1 ? '' : 's'}</span>
              {resistant > 0 && <span className="btag r">{resistant} resistant</span>}
              <span className="btag b">{named.length} mapped</span>
            </div>
          )}
        </div>

        {/* 4 — What do you need from me? (the reply hook) */}
        {(ask || !publicView) && (
          <div className="bs">
            <div className="bst">What I need from you</div>
            {ask ? (
              <div style={{ background: 'rgba(91,134,163,0.12)', borderLeft: '3px solid #5B86A3', borderRadius: '0 8px 8px 0', padding: '12px 16px', fontSize: '14px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                {ask}
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>
                Add a clear ask — it’s the line that gets your sponsor to reply.
              </div>
            )}
          </div>
        )}

        {/* Adoption snapshot */}
        {metrics.length > 0 && (
          <div className="bs">
            <div className="bst">Adoption</div>
            {metrics.map((m) => {
              const c = parseFloat(m.current)
              const t = parseFloat(m.target)
              const p2 = isFinite(c) && isFinite(t) && t !== 0 ? Math.min(100, Math.round((c / t) * 100)) : 0
              return (
                <div key={m.id} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{m.name}</span>
                    <span style={{ fontSize: '13px', color: '#B8D0DE', fontWeight: 700 }}>{m.current ? `${m.current}${m.unit} / ${m.target}${m.unit}` : ''}</span>
                  </div>
                  {m.current && m.target && (
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${p2}%`, background: p2 >= 80 ? '#22c55e' : p2 >= 50 ? '#f59e0b' : '#5B86A3', borderRadius: '4px' }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {avg !== null && topRisks.length === 0 && (
          <div className="bs">
            <div className="bst">Risk going in</div>
            <span className={`btag ${sevClass(avg)}`}>{riskLabel(avg)} risk · {avg}/10</span>
          </div>
        )}
      </div>

      <div className="brief-ft">
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
          Made with <span style={{ color: '#B8D0DE' }}>Adaptus</span>
        </div>
        {publicView ? (
          <a
            href="/"
            style={{ fontSize: '12px', fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#5B86A3,#3E6580)', borderRadius: '999px', padding: '7px 16px', textDecoration: 'none' }}
          >
            Build your own change plan →
          </a>
        ) : (
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{longDate(new Date())}</div>
        )}
      </div>
    </div>
  )
}
