import { useState } from 'react'
import { useStageEditor } from '@/state/AppContext'
import type { Project } from '@/types'
import { TipBox } from '@/components/TipBox'
import { InsightCallout, StageIntro } from '@/components/ui'
import { LAUNCH_ITEMS } from '@/data/constants'
import { coaching } from '@/data/coaching'
import { avgRisk, pct, riskColor, riskLabel } from '@/lib/format'

const longDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

function buildActions(proj: Project, res: number) {
  const { risk, milestones } = proj.stageData
  const actions: string[] = []
  if (res > 0) actions.push(`Address ${res} resistant stakeholder${res > 1 ? 's' : ''} with targeted engagement`)
  const highLikelihood = risk.items.filter((r) => r.likelihood >= 4).length
  if (highLikelihood > 0) actions.push(`Activate mitigations for ${highLikelihood} high-likelihood risks`)
  if (milestones.launchChecklist.length < 6) actions.push(`Complete ${LAUNCH_ITEMS.length - milestones.launchChecklist.length} remaining launch readiness items`)
  actions.push('Continue weekly progress reporting through go-live')
  return actions.slice(0, 5)
}

function Brief({ proj }: { proj: Project }) {
  const { define: def, risk, adoption: ad, stakeholders: st, milestones: mil, sponsor: sp, groups } = proj.stageData
  const avg = avgRisk(risk.items)
  const adv = st.rows.filter((r) => r.support === 'Advocate').length
  const res = st.rows.filter((r) => r.support === 'Resistant').length
  const neu = st.rows.filter((r) => r.support === 'Neutral').length
  const totalPeople = groups.groups.reduce((s, g) => s + (parseInt(g.size) || 0), 0)
  const actions = buildActions(proj, res)
  const clC = mil.launchChecklist.length
  const clP = Math.round((clC / LAUNCH_ITEMS.length) * 100)

  const copyText = () => {
    navigator.clipboard.writeText(
      `EXECUTIVE UPDATE — ${proj.name}\n${proj.type} · ${new Date().toLocaleDateString()}\nStatus: ${pct(proj)}% Complete\n\n` +
        `SPONSOR: ${sp.name ? `${sp.name} (${sp.role})` : 'Not defined'}\n\n` +
        `CHANGE SUMMARY\n${def.statement || ''}\nBusiness Driver: ${def.whyNow || ''}\nSuccess: ${def.successLooks || ''}\n\n` +
        `STAKEHOLDERS\nAdvocates: ${adv} | Neutral: ${neu} | Resistant: ${res}\n\n` +
        `RISK: ${avg ?? 'N/A'}/10\n\n` +
        `ADOPTION\n${ad.metrics.map((m) => `${m.name}: ${m.current || '—'}${m.unit}/${m.target}${m.unit}`).join(', ') || 'Not tracked'}\n\n` +
        `LAUNCH: ${clC}/${LAUNCH_ITEMS.length} items ready\n\n` +
        `ACTIONS\n${actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}`,
    )
  }

  return (
    <div className="brief-wrap">
      <div className="brief-hdr">
        <div className="brief-badge">{pct(proj)}% Complete</div>
        <h1>{proj.name}</h1>
        <div className="bm">{proj.type} · Executive Update · {longDate(new Date())}</div>
      </div>
      <div className="brief-body">
        {/* At a glance */}
        <div className="bs">
          <div className="bst">At a Glance</div>
          <div className="bsg">
            <div className="bsc"><div className="v">{pct(proj)}%</div><div className="l">Progress</div></div>
            <div className="bsc"><div className="v">{totalPeople || '—'}</div><div className="l">People Impacted</div></div>
            <div className="bsc"><div className="v" style={avg !== null ? { color: riskColor(avg) } : undefined}>{avg !== null ? `${avg}/10` : '—'}</div><div className="l">Risk Score</div></div>
          </div>
        </div>

        {/* Sponsor */}
        {sp.name && (
          <div className="bs">
            <div className="bst">Executive Sponsor</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '12px 16px' }}>
              <div style={{ fontSize: '28px' }}>🏅</div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{sp.name}</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{sp.role}</div>
              </div>
              {sp.sponsorActions.length > 0 && (
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '10px' }}>
                  {sp.sponsorActions.length} sponsor actions committed
                </div>
              )}
            </div>
          </div>
        )}

        {/* Change summary */}
        {(def.statement || def.whyNow) && (
          <div className="bs">
            <div className="bst">Change Summary</div>
            {def.statement && <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>{def.statement}</p>}
            {def.whyNow && (
              <div style={{ marginTop: '10px', background: 'rgba(91,134,163,0.08)', borderLeft: '3px solid #5B86A3', borderRadius: '0 8px 8px 0', padding: '10px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#5B86A3', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>Business Driver</span>
                {def.whyNow}
              </div>
            )}
            {def.successLooks && (
              <div style={{ marginTop: '10px', background: 'rgba(34,197,94,0.08)', borderLeft: '3px solid #22c55e', borderRadius: '0 8px 8px 0', padding: '10px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>Success Criteria</span>
                {def.successLooks}
              </div>
            )}
          </div>
        )}

        {/* Stakeholders */}
        {st.rows.length > 0 && (
          <div className="bs">
            <div className="bst">Stakeholder Landscape</div>
            <div>
              {adv > 0 && <span className="btag g">✓ {adv} Advocate{adv > 1 ? 's' : ''}</span>}
              {neu > 0 && <span className="btag a">◎ {neu} Neutral</span>}
              {res > 0 && <span className="btag r">⚡ {res} Resistant</span>}
              <span className="btag b">{st.rows.length} mapped</span>
            </div>
            {res > adv ? (
              <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <span style={{ color: '#fca5a5' }}>⚠️ More resistant stakeholders than advocates. Targeted 1:1 engagement recommended.</span>
              </div>
            ) : adv > 0 ? (
              <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <span style={{ color: '#86efac' }}>✅ Coalition forming. Continue reinforcing advocate network.</span>
              </div>
            ) : (
              <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', background: 'rgba(91,134,163,0.08)', border: '1px solid rgba(91,134,163,0.15)' }}>
                <span style={{ color: '#B8D0DE' }}>Engagement underway.</span>
              </div>
            )}
          </div>
        )}

        {/* Risk */}
        {risk.items.length > 0 && avg !== null && (
          <div className="bs">
            <div className="bst">Risk Profile</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: riskColor(avg) }}>{avg}<span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>/10</span></div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{riskLabel(avg)} Risk</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(avg / 10) * 100}%`, background: riskColor(avg), borderRadius: '4px' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Adoption */}
        {ad.metrics.length > 0 && (
          <div className="bs">
            <div className="bst">Adoption Metrics</div>
            {ad.metrics.map((m) => {
              if (!m.name) return null
              const hasProgress = m.current && m.target
              const p2 = hasProgress ? Math.min(100, Math.round((parseFloat(m.current) / parseFloat(m.target)) * 100)) : 0
              return (
                <div key={m.id} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{m.name}</div>
                    <div style={{ fontSize: '13px', color: '#B8D0DE', fontWeight: 700 }}>{m.current ? `${m.current}${m.unit} / ${m.target}${m.unit}` : ''}</div>
                  </div>
                  {hasProgress && (
                    <>
                      <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${p2}%`, background: p2 >= 80 ? '#22c55e' : p2 >= 50 ? '#f59e0b' : '#5B86A3', borderRadius: '4px', transition: 'width 0.6s' }} />
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '3px' }}>{p2}% of target</div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Launch readiness */}
        <div className="bs">
          <div className="bst">Launch Readiness</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: clP >= 75 ? '#22c55e' : clP >= 50 ? '#f59e0b' : '#ef4444' }}>
                {clC}<span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>/{LAUNCH_ITEMS.length}</span>
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Items Complete</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${clP}%`, background: clP >= 75 ? '#22c55e' : clP >= 50 ? '#f59e0b' : '#ef4444', borderRadius: '4px' }} />
              </div>
            </div>
            {mil.goLiveDate && (
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
                Go-live: <strong style={{ color: '#fff' }}>{new Date(mil.goLiveDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Recommended actions */}
        <div className="bs">
          <div className="bst">Recommended Actions</div>
          {actions.map((a, i) => (
            <div className="bai" key={i}>
              <div className="bad" />
              {a}
            </div>
          ))}
        </div>
      </div>
      <div className="brief-ft">
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Generated by Adaptus · {longDate(new Date())}</div>
        <button
          type="button"
          onClick={copyText}
          style={{ background: 'rgba(91,134,163,0.15)', border: '1px solid rgba(91,134,163,0.3)', borderRadius: '6px', padding: '6px 14px', color: '#B8D0DE', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit' }}
        >
          📋 Copy as text
        </button>
      </div>
    </div>
  )
}

export function ExecutiveStage() {
  const { project, data, update } = useStageEditor('executive')
  const [generating, setGenerating] = useState(false)

  const generate = () => {
    if (generating) return
    setGenerating(true)
    setTimeout(() => {
      update({ generated: true })
      setGenerating(false)
    }, 1200)
  }

  return (
    <div>
      <StageIntro icon={coaching.executive.icon}>{coaching.executive.intro}</StageIntro>
      <InsightCallout tone={coaching.executive.richerNote.tone} style={{ marginBottom: '16px' }}>
        {coaching.executive.richerNote.text}
      </InsightCallout>
      <TipBox stageId="executive" />
      <button
        type="button"
        onClick={generate}
        style={{
          background: generating ? 'rgba(91,134,163,0.3)' : 'linear-gradient(135deg,#5B86A3,#3E6580)',
          border: 'none',
          borderRadius: '10px',
          padding: '12px 26px',
          color: '#fff',
          fontWeight: 600,
          fontSize: '14px',
          cursor: 'pointer',
          marginBottom: '20px',
          fontFamily: 'inherit',
        }}
      >
        {generating ? '⏳ Generating...' : '✨ Generate Executive Brief'}
      </button>
      {data.generated && project && <Brief proj={project} />}
    </div>
  )
}
