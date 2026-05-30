import { Printer } from 'lucide-react'
import { useActiveProject, useStageEditor } from '@/state/AppContext'
import { FieldCoach, TextArea } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { coaching } from '@/data/coaching'
import { avgRisk, preparedness, riskLabel } from '@/lib/format'

const longDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
const prepColor = (p: number) => (p >= 80 ? '#22c55e' : p >= 50 ? '#f59e0b' : '#ef4444')

export function ReportStage() {
  const project = useActiveProject()
  const { data: closeout, update } = useStageEditor('closeout')
  if (!project) return null

  const sd = project.stageData
  const prep = preparedness(project)
  const avg = avgRisk(sd.risk.items)
  const metrics = sd.adoption.metrics.filter((m) => m.name)
  const onTarget = metrics.filter((m) => {
    const c = parseFloat(m.current)
    const t = parseFloat(m.target)
    return isFinite(c) && isFinite(t) && t !== 0 && c / t >= 0.8
  }).length
  const goLive = sd.milestones.goLiveDate
    ? new Date(sd.milestones.goLiveDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

  const fc = coaching.closeout.fields

  // The editable closeout reflections (feed the printable report below) run
  // through the guided/summary flow; the report itself always renders beneath.
  const steps: WizardStep[] = [
    {
      id: 'wins',
      title: 'Wins',
      isFilled: !!closeout.wins.trim(),
      summary: closeout.wins,
      node: (
        <FieldCoach label={fc.wins.label} why={fc.wins.why} example={fc.wins.example} onUseExample={() => update({ wins: fc.wins.example })}>
          <TextArea value={closeout.wins} onCommit={(v) => update({ wins: v })} placeholder="What worked? What would you repeat?" rows={3} />
        </FieldCoach>
      ),
    },
    {
      id: 'lessons',
      title: 'Lessons',
      isFilled: !!closeout.lessons.trim(),
      summary: closeout.lessons,
      node: (
        <FieldCoach label={fc.lessons.label} why={fc.lessons.why} example={fc.lessons.example} onUseExample={() => update({ lessons: fc.lessons.example })}>
          <TextArea value={closeout.lessons} onCommit={(v) => update({ lessons: v })} placeholder="What would you do differently?" rows={3} />
        </FieldCoach>
      ),
    },
    {
      id: 'shoutouts',
      title: 'Shout-outs',
      isFilled: !!closeout.shoutouts.trim(),
      summary: closeout.shoutouts,
      node: (
        <FieldCoach label={fc.shoutouts.label} why={fc.shoutouts.why} example={fc.shoutouts.example} onUseExample={() => update({ shoutouts: fc.shoutouts.example })}>
          <TextArea value={closeout.shoutouts} onCommit={(v) => update({ shoutouts: v })} placeholder="Name the people who went above and beyond." rows={2} />
        </FieldCoach>
      ),
    },
  ]

  return (
    <div>
      <StageFlow stageId="executive" icon={coaching.report.icon} blurb={coaching.report.intro} steps={steps} />

      <button
        type="button"
        onClick={() => window.print()}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg,#5B86A3,#3E6580)', border: 'none', borderRadius: '10px', padding: '12px 26px', color: 'var(--on-accent)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', margin: '8px 0 20px', fontFamily: 'inherit' }}
      >
        <Printer size={16} /> Print / Save as PDF
      </button>

      {/* The printable report */}
      <div className="print-area">
        <div className="brief-wrap">
          <div className="brief-hdr">
            <div className="brief-badge">{prep.pct}% prepared</div>
            <h1>{project.name}</h1>
            <div className="bm">{project.type || 'Change initiative'} · Launch Success Report · {longDate(new Date())}</div>
          </div>
          <div className="brief-body">
            {/* Outcome */}
            <div className="bs">
              <div className="bst">Launch Outcome</div>
              <div className="bsg">
                <div className="bsc"><div className="v" style={{ color: prepColor(prep.pct) }}>{prep.pct}%</div><div className="l">Preparedness</div></div>
                <div className="bsc"><div className="v">{goLive}</div><div className="l">Go-live</div></div>
                <div className="bsc"><div className="v">{metrics.length ? `${onTarget}/${metrics.length}` : '—'}</div><div className="l">Metrics on target</div></div>
              </div>
            </div>

            {/* Change summary */}
            {(sd.define.statement || sd.define.whyNow) && (
              <div className="bs">
                <div className="bst">What We Changed</div>
                {sd.define.statement && <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.78)', lineHeight: 1.7 }}>{sd.define.statement}</p>}
                {sd.define.successLooks && (
                  <div style={{ marginTop: '10px', background: 'rgba(34,197,94,0.08)', borderLeft: '3px solid #22c55e', borderRadius: '0 8px 8px 0', padding: '10px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>Goal we set</span>
                    {sd.define.successLooks}
                  </div>
                )}
              </div>
            )}

            {/* Adoption */}
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

            {/* Risk recap */}
            {avg !== null && (
              <div className="bs">
                <div className="bst">Risk Going In</div>
                <span className="btag b">{riskLabel(avg)} risk · {avg}/10</span>
              </div>
            )}

            {/* Wins / lessons / shoutouts */}
            {closeout.wins && (
              <div className="bs">
                <div className="bst">What Went Well</div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.78)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{closeout.wins}</p>
              </div>
            )}
            {closeout.lessons && (
              <div className="bs">
                <div className="bst">What We'd Do Differently</div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.78)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{closeout.lessons}</p>
              </div>
            )}
            {closeout.shoutouts && (
              <div className="bs">
                <div className="bst">Shoutouts</div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.78)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{closeout.shoutouts}</p>
              </div>
            )}

            {/* Sustainment */}
            {(sd.sustainment.reinforcementOwner || sd.sustainment.metrics) && (
              <div className="bs">
                <div className="bst">Keeping It Sticking</div>
                {sd.sustainment.reinforcementOwner && <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.78)', lineHeight: 1.7 }}><strong style={{ color: '#fff' }}>Owner:</strong> {sd.sustainment.reinforcementOwner}</p>}
                {sd.sustainment.metrics && <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginTop: '4px' }}>{sd.sustainment.metrics}</p>}
              </div>
            )}
          </div>
          <div className="brief-ft">
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Generated by Adaptus · {longDate(new Date())}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
