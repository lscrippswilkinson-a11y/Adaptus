import { useEffect, useState } from 'react'
import { useApp, useStageEditor } from '@/state/AppContext'
import type { MilestoneOwner, StageId } from '@/types'
import { AddButton, DelButton, StageIntro, TextInput } from '@/components/ui'
import { coaching } from '@/data/coaching'
import { STAGES } from '@/data/stages'
import { avgRisk, collectLaunchTasks, preparedness, riskColor, riskLabel, type PrepTask } from '@/lib/format'
import { uid } from '@/lib/id'

const prepColor = (p: number) => (p >= 80 ? '#22c55e' : p >= 50 ? '#f59e0b' : '#ef4444')
const GROUP_ORDER = ['Launch readiness', 'Testing', 'Dependencies', 'Training', 'Your tasks']

/** Live ticking countdown to the go-live date (handles today / past gracefully). */
function GoLiveCountdown({ date }: { date: string }) {
  const [, tick] = useState(0)
  useEffect(() => {
    if (!date) return
    const t = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [date])

  if (!date) {
    return <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>Set a target date to start the countdown →</div>
  }

  const target = new Date(date + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const targetDay = new Date(target)
  targetDay.setHours(0, 0, 0, 0)

  if (targetDay.getTime() === today.getTime()) {
    return <div style={{ fontSize: '22px', fontWeight: 800, color: '#22c55e', marginTop: '4px' }}>🚀 Go-live is today!</div>
  }
  if (targetDay.getTime() < today.getTime()) {
    const daysAgo = Math.round((today.getTime() - targetDay.getTime()) / 86400000)
    return <div style={{ fontSize: '18px', fontWeight: 700, color: '#86efac', marginTop: '4px' }}>✅ Launched {daysAgo} day{daysAgo === 1 ? '' : 's'} ago</div>
  }

  const ms = target.getTime() - Date.now()
  const d = Math.floor(ms / 86400000)
  const h = Math.floor((ms % 86400000) / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const urgent = d < 7
  const boxes: [string, number][] = [['Days', d], ['Hrs', h], ['Min', m], ['Sec', s]]
  return (
    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
      {boxes.map(([label, val]) => (
        <div key={label} style={{ minWidth: '52px', textAlign: 'center', background: 'rgba(255,255,255,0.04)', border: `1px solid ${urgent ? 'rgba(245,158,11,0.4)' : 'rgba(91,134,163,0.3)'}`, borderRadius: '8px', padding: '8px 6px' }}>
          <div style={{ fontSize: '22px', fontWeight: 800, color: urgent ? '#fcd34d' : '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{String(val).padStart(2, '0')}</div>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>{label}</div>
        </div>
      ))}
    </div>
  )
}

export function DashboardStage() {
  const { dispatch } = useApp()
  const { project, data: milestones, update: updateMilestones } = useStageEditor('milestones')
  const { update: updateTesting } = useStageEditor('testing')
  const { update: updateDeps } = useStageEditor('dependencies')
  const { update: updateTraining } = useStageEditor('training')
  const [draft, setDraft] = useState('')
  if (!project) return null

  const prep = preparedness(project)
  const tasks = collectLaunchTasks(project)
  const sd = project.stageData

  const goTo = (id: StageId) => {
    const idx = STAGES.findIndex((s) => s.id === id)
    if (idx >= 0) dispatch({ type: 'GO_TO_STAGE', stageIdx: idx })
  }

  const toggle = (t: PrepTask) => {
    switch (t.source) {
      case 'checklist': {
        const set = new Set(milestones.launchChecklist)
        if (set.has(t.item!)) set.delete(t.item!)
        else set.add(t.item!)
        updateMilestones({ launchChecklist: [...set] })
        break
      }
      case 'custom':
        updateMilestones({ customTasks: milestones.customTasks.map((c) => (c.id === t.refId ? { ...c, done: !c.done } : c)) })
        break
      case 'training':
        updateTraining({ items: sd.training.items.map((i) => (i.id === t.refId ? { ...i, done: !i.done } : i)) })
        break
      case 'testing':
        updateTesting({ items: sd.testing.items.map((i) => (i.id === t.refId ? { ...i, status: i.status === 'Passed' ? 'Not started' : 'Passed' } : i)) })
        break
      case 'dependencies':
        updateDeps({ items: sd.dependencies.items.map((i) => (i.id === t.refId ? { ...i, status: i.status === 'Ready' ? 'Not started' : 'Ready' } : i)) })
        break
    }
  }

  const addCustom = () => {
    if (!draft.trim()) return
    updateMilestones({ customTasks: [...milestones.customTasks, { id: uid(), label: draft.trim(), done: false }] })
    setDraft('')
  }
  const delCustom = (id: number) => updateMilestones({ customTasks: milestones.customTasks.filter((c) => c.id !== id) })

  // Workstream owners (kept editable here)
  const setOwner = (id: number, patch: Partial<MilestoneOwner>) =>
    updateMilestones({ owners: milestones.owners.map((o) => (o.id === id ? { ...o, ...patch } : o)) })
  const addOwner = () => updateMilestones({ owners: [...milestones.owners, { id: uid(), name: '', workstream: '', email: '' }] })
  const delOwner = (id: number) => updateMilestones({ owners: milestones.owners.filter((o) => o.id !== id) })

  const avg = avgRisk(sd.risk.items)
  const adv = sd.stakeholders.rows.filter((r) => r.support === 'Advocate').length
  const res = sd.stakeholders.rows.filter((r) => r.support === 'Resistant').length

  const groupsCount = sd.groups.groups.length
  const sponsorVal = sd.sponsor.name ? (sd.sponsor.role ? `${sd.sponsor.name} · ${sd.sponsor.role}` : sd.sponsor.name) : ''
  const summary: { icon: string; label: string; value: string; empty: string; jump: StageId; color?: string }[] = [
    { icon: '🎯', label: 'The change', value: sd.define.statement, empty: 'Define what’s changing', jump: 'define' },
    { icon: '👥', label: 'Impacted groups', value: groupsCount ? `${groupsCount} group${groupsCount === 1 ? '' : 's'} mapped` : '', empty: 'List who’s affected', jump: 'groups' },
    { icon: '🏅', label: 'Sponsor', value: sponsorVal, empty: 'Name your sponsor', jump: 'sponsor' },
    { icon: '⚡', label: 'Overall risk', value: avg !== null ? `${riskLabel(avg)} · ${avg}/10` : '', empty: 'Log your risks', jump: 'risk', color: avg !== null ? riskColor(avg) : undefined },
    { icon: '🤝', label: 'Coalition', value: sd.stakeholders.rows.length ? `${adv} advocate${adv === 1 ? '' : 's'} · ${res} resistant` : '', empty: 'Map stakeholders', jump: 'stakeholders' },
  ]

  return (
    <div>
      <StageIntro icon={coaching.dashboard.icon}>{coaching.dashboard.intro}</StageIntro>

      {/* Go-live countdown */}
      <div className="cq-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div className="cq-lbl">Go-live countdown</div>
            <GoLiveCountdown date={milestones.goLiveDate} />
          </div>
          <div style={{ width: '180px', flexShrink: 0 }}>
            <div className="cq-lbl">Target date</div>
            <input type="date" className="cq-input" value={milestones.goLiveDate} onChange={(e) => updateMilestones({ goLiveDate: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Preparedness score */}
      <div className="cq-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '40px', fontWeight: 800, color: prepColor(prep.pct), lineHeight: 1 }}>{prep.pct}%</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Launch Preparedness</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>{prep.done} of {prep.total} tasks complete</div>
            <div style={{ height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${prep.pct}%`, background: prepColor(prep.pct), borderRadius: '5px', transition: 'width 0.4s' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Aggregated task list */}
      <div className="cq-card">
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '4px' }}>Launch tasks</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '14px' }}>Pulled from your planning sections. Tick items off here or in their own section — your score updates either way.</div>

        {GROUP_ORDER.map((group) => {
          const items = tasks.filter((t) => t.group === group)
          if (items.length === 0 && group !== 'Your tasks') return null
          return (
            <div key={group} style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#B8D0DE', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{group}</div>
              {items.map((t) => (
                <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', marginBottom: '6px' }}>
                  <button
                    type="button"
                    onClick={() => toggle(t)}
                    style={{ width: '20px', height: '20px', borderRadius: '5px', border: '1.5px solid', flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#fff', background: t.done ? '#22c55e' : 'transparent', borderColor: t.done ? '#22c55e' : 'rgba(255,255,255,0.2)', fontFamily: 'inherit' }}
                  >
                    {t.done ? '✓' : ''}
                  </button>
                  <span style={{ flex: 1, fontSize: '13px', color: t.done ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.85)', textDecoration: t.done ? 'line-through' : 'none' }}>{t.label}</span>
                  {t.source === 'custom' && <DelButton onClick={() => delCustom(t.refId!)} />}
                </div>
              ))}
              {group === 'Your tasks' && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <input
                    type="text"
                    className="cq-input"
                    value={draft}
                    placeholder="Add your own launch task…"
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustom()}
                  />
                  <AddButton label="Add" onClick={addCustom} style={{ width: 'auto', flexShrink: 0, padding: '9px 18px' }} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Planning summary */}
      <div className="cq-card">
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '4px' }}>From your plan</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '14px' }}>A snapshot of what you decided earlier. Tap any card to jump back and edit it.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: '10px' }}>
          {summary.map((s) => {
            const filled = !!s.value
            return (
              <button key={s.label} type="button" className="summary-card" onClick={() => goTo(s.jump)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px' }}>{s.icon}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{s.label}</span>
                </div>
                <div style={{ fontSize: '13px', lineHeight: 1.45, color: filled ? (s.color ?? 'rgba(255,255,255,0.72)') : 'rgba(255,255,255,0.35)', fontStyle: filled ? 'normal' : 'italic', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {filled ? s.value : s.empty}
                </div>
                <div style={{ marginTop: '8px', fontSize: '11px', fontWeight: 600, color: filled ? '#B8D0DE' : '#fcd34d' }}>{filled ? 'Edit →' : 'Add →'}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Workstream owners */}
      <div className="cq-card">
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '12px' }}>Workstream owners</div>
        {milestones.owners.map((o) => (
          <div key={o.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
            <TextInput value={o.name} onCommit={(v) => setOwner(o.id, { name: v })} placeholder="Name" style={{ flex: 1 }} />
            <TextInput value={o.workstream} onCommit={(v) => setOwner(o.id, { workstream: v })} placeholder="Workstream" style={{ flex: 1 }} />
            <TextInput value={o.email} onCommit={(v) => setOwner(o.id, { email: v })} placeholder="Email" style={{ flex: 1 }} />
            <DelButton onClick={() => delOwner(o.id)} />
          </div>
        ))}
        <AddButton label="+ Add Owner" onClick={addOwner} />
      </div>
    </div>
  )
}
