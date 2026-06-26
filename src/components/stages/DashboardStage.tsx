import { useEffect, useState } from 'react'
import { ArrowRight, ChevronDown, ChevronRight, Share2, type LucideIcon } from 'lucide-react'
import { useApp, useStageEditor } from '@/state/AppContext'
import { useShare } from '@/state/ShareContext'
import type { MilestoneOwner, StageId } from '@/types'
import { AddButton, DelButton, TextInput } from '@/components/ui'
import { STAGES } from '@/data/stages'
import { avgRisk, collectLaunchTasks, preparedness, riskColor, riskLabel, type PrepTask } from '@/lib/format'
import { uid } from '@/lib/id'

// Green once meaningfully on track (>70%), amber mid, red low, green reads as
// good progress rather than a warning.
const prepColor = (p: number) => (p >= 70 ? '#22c55e' : p >= 40 ? '#f59e0b' : '#ef4444')
const GROUP_ORDER = [
  'Launch readiness',
  'Sponsor commitments',
  'Stakeholders',
  'Communications',
  'Training',
  'Testing',
  'Dependencies',
  'Risks',
  'Resistance',
  'Impacted groups',
  'Your tasks',
]

/** Display labels for task groups (keys above stay stable for the data layer). */
const GROUP_LABELS: Record<string, string> = {
  'Launch readiness': 'Go-live checklist', // avoid clashing with the "Launch Preparedness" score label
  'Your tasks': 'Additional tasks',
}
const labelFor = (g: string) => GROUP_LABELS[g] ?? g

/** Live ticking countdown to the go-live date (handles today / past gracefully). */
function GoLiveCountdown({ date }: { date: string }) {
  const [, tick] = useState(0)
  useEffect(() => {
    if (!date) return
    const t = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [date])

  if (!date) {
    return <div style={{ fontSize: '14px', color: 'rgba(var(--fg),0.4)', marginTop: '4px' }}>Set a target date to start the countdown →</div>
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
        <div key={label} style={{ minWidth: '52px', textAlign: 'center', background: 'rgba(var(--fg),0.04)', border: `1px solid ${urgent ? 'rgba(245,158,11,0.4)' : 'rgba(91,134,163,0.3)'}`, borderRadius: '8px', padding: '8px 6px' }}>
          <div style={{ fontSize: '22px', fontWeight: 800, color: urgent ? '#fcd34d' : 'var(--text)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{String(val).padStart(2, '0')}</div>
          <div style={{ fontSize: '9px', color: 'rgba(var(--fg),0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>{label}</div>
        </div>
      ))}
    </div>
  )
}

export function DashboardStage() {
  const { dispatch } = useApp()
  const openShare = useShare()
  const { project, data: milestones, update: updateMilestones } = useStageEditor('milestones')
  const { update: updateTesting } = useStageEditor('testing')
  const { update: updateDeps } = useStageEditor('dependencies')
  const { update: updateTraining } = useStageEditor('training')
  const { update: updateSponsor } = useStageEditor('sponsor')
  // Explicit expand/collapse overrides per group; absent => default (completed
  // sections collapse, others stay open).
  const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>({})
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
      case 'sponsor':
        updateSponsor({ sponsorActions: sd.sponsor.sponsorActions.map((a) => (a.id === t.refId ? { ...a, done: !a.done } : a)) })
        break
      case 'checkoff':
        updateMilestones({ checkoff: { ...(milestones.checkoff ?? {}), [t.key]: !t.done } })
        break
    }
  }

  // Add a blank, user-fillable task to a given section (any group, not just "Your tasks").
  const addTaskTo = (group: string) =>
    updateMilestones({ customTasks: [...milestones.customTasks, { id: uid(), label: '', done: false, group }] })
  const setCustomLabel = (id: number, label: string) =>
    updateMilestones({ customTasks: milestones.customTasks.map((c) => (c.id === id ? { ...c, label } : c)) })
  const delCustom = (id: number) => updateMilestones({ customTasks: milestones.customTasks.filter((c) => c.id !== id) })

  // Remove an auto-derived task from the dashboard view only (its planning data is untouched).
  const hiddenTasks = milestones.hiddenTasks ?? []
  const hideTask = (key: string) =>
    updateMilestones({ hiddenTasks: hiddenTasks.includes(key) ? hiddenTasks : [...hiddenTasks, key] })
  const restoreHidden = () => updateMilestones({ hiddenTasks: [] })
  // A row's remove button: truly delete user-added tasks, just hide derived ones.
  const removeTask = (t: PrepTask) => (t.source === 'custom' ? delCustom(t.refId!) : hideTask(t.key))

  // Owner name per task, keyed by the task's stable key — works for every source.
  const taskOwners = milestones.taskOwners ?? {}
  const setTaskOwner = (key: string, name: string) =>
    updateMilestones({ taskOwners: { ...taskOwners, [key]: name } })
  // Raw custom-task labels for inline editing (PrepTask.label bakes in a fallback).
  const customById = new Map(milestones.customTasks.map((c) => [c.id, c]))

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
  const iconFor = (id: StageId) => STAGES.find((s) => s.id === id)!.icon
  const summary: { icon: LucideIcon; label: string; value: string; empty: string; jump: StageId; color?: string }[] = [
    { icon: iconFor('define'), label: 'The change', value: sd.define.statement, empty: 'Define what’s changing', jump: 'define' },
    { icon: iconFor('groups'), label: 'Impacted groups', value: groupsCount ? `${groupsCount} group${groupsCount === 1 ? '' : 's'} mapped` : '', empty: 'List who’s affected', jump: 'groups' },
    { icon: iconFor('sponsor'), label: 'Sponsor', value: sd.sponsor.noSponsor ? 'No sponsor — flagged as a risk' : sponsorVal, empty: 'Name your sponsor', jump: 'sponsor', color: sd.sponsor.noSponsor ? '#fca5a5' : undefined },
    { icon: iconFor('risk'), label: 'Overall risk', value: avg !== null ? `${riskLabel(avg)} · ${avg}/10` : '', empty: 'Log your risks', jump: 'risk', color: avg !== null ? riskColor(avg) : undefined },
    { icon: iconFor('stakeholders'), label: 'Coalition', value: sd.stakeholders.rows.length ? `${adv} advocate${adv === 1 ? '' : 's'} · ${res} resistant` : '', empty: 'Map stakeholders', jump: 'stakeholders' },
  ]

  return (
    <div>
      {/* Prominent share CTA: sharing the plan is the intended next move here. */}
      {openShare && (
        <button
          type="button"
          onClick={openShare}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            textAlign: 'left',
            background: 'linear-gradient(135deg, #5B86A3 0%, #3E6580 100%)',
            border: 'none',
            borderRadius: '14px',
            padding: '18px 22px',
            marginBottom: '16px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 8px 22px rgba(62,101,128,0.4)',
          }}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Share2 size={22} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>Share this plan with your team</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>
              Send a read-only brief to your sponsor or team so everyone sees the plan and where it stands.
            </div>
          </div>
          <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(255,255,255,0.95)', color: '#1f3445', borderRadius: '10px', padding: '11px 18px', fontWeight: 700, fontSize: '14px' }}>
            Share <ArrowRight size={17} />
          </span>
        </button>
      )}

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
            <div style={{ fontSize: '11px', color: 'rgba(var(--fg),0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Launch Preparedness</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', color: 'rgba(var(--fg),0.6)', marginBottom: '6px' }}>{prep.done} of {prep.total} tasks complete</div>
            <div style={{ height: '10px', background: 'rgba(var(--fg),0.08)', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${prep.pct}%`, background: prepColor(prep.pct), borderRadius: '5px', transition: 'width 0.4s' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Aggregated task list */}
      <div className="cq-card">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(var(--fg),0.8)', marginBottom: '4px' }}>Launch tasks</div>
          {hiddenTasks.length > 0 && (
            <button type="button" onClick={restoreHidden} style={{ flexShrink: 0, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600, color: 'var(--accent-text)' }}>
              ↩ Restore {hiddenTasks.length} removed
            </button>
          )}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(var(--fg),0.4)', marginBottom: '14px' }}>Pulled from your planning sections. Tick items off here or in their own section, your score updates either way. Removing a task here hides it from this list, your plan stays intact.</div>

        {GROUP_ORDER.map((group, gi) => {
          const items = tasks.filter((t) => t.group === group)
          const isCustom = group === 'Your tasks'
          if (items.length === 0 && !isCustom) return null

          const total = items.length
          const doneCount = items.filter((t) => t.done).length
          const allDone = total > 0 && doneCount === total
          // Completed sections collapse by default to cut scroll; "Additional
          // tasks" stays open so its add field is always reachable.
          const open = groupOpen[group] ?? (isCustom ? true : !allDone)
          // checkoff items are manual confirmations, not auto-derived; flag that.
          const isCheckoff = total > 0 && items.every((t) => t.source === 'checkoff')

          return (
            <div key={group} style={{ borderTop: gi === 0 ? 'none' : '1px solid rgba(var(--fg),0.07)', paddingTop: gi === 0 ? 0 : '18px', marginBottom: '18px' }}>
              <button
                type="button"
                onClick={() => setGroupOpen((p) => ({ ...p, [group]: !open }))}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {open ? <ChevronDown size={14} color="var(--accent-text)" /> : <ChevronRight size={14} color="var(--accent-text)" />}
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-text)', textTransform: 'uppercase', letterSpacing: '1px' }}>{labelFor(group)}</span>
                {total > 0 && (
                  <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 600, color: allDone ? '#86efac' : 'rgba(var(--fg),0.45)' }}>
                    {allDone ? `✓ ${doneCount}/${total} complete` : `${doneCount}/${total}`}
                  </span>
                )}
              </button>

              {open && isCheckoff && (
                <div style={{ fontSize: '11px', color: 'rgba(var(--fg),0.4)', fontStyle: 'italic', margin: '8px 0 0 22px' }}>Confirm when ready</div>
              )}

              {open && (
                <div style={{ marginTop: '12px', marginLeft: '22px' }}>
                  {items.map((t) => {
                    const isCustomRow = t.source === 'custom'
                    return (
                      <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: 'rgba(var(--fg),0.02)', border: '1px solid rgba(var(--fg),0.06)', borderRadius: '8px', marginBottom: '6px' }}>
                        <button
                          type="button"
                          onClick={() => toggle(t)}
                          style={{ width: '20px', height: '20px', borderRadius: '5px', border: '1.5px solid', flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--text)', background: t.done ? '#22c55e' : 'transparent', borderColor: t.done ? '#22c55e' : 'rgba(var(--fg),0.2)', fontFamily: 'inherit' }}
                        >
                          {t.done ? '✓' : ''}
                        </button>
                        {isCustomRow ? (
                          <TextInput
                            value={customById.get(t.refId!)?.label ?? ''}
                            onCommit={(v) => setCustomLabel(t.refId!, v)}
                            placeholder="Describe this task…"
                            style={{ flex: 1, minWidth: 0 }}
                          />
                        ) : (
                          <span style={{ flex: 1, minWidth: 0, fontSize: '13px', color: t.done ? 'rgba(var(--fg),0.4)' : 'rgba(var(--fg),0.85)', textDecoration: t.done ? 'line-through' : 'none' }}>{t.label}</span>
                        )}
                        <TextInput
                          value={taskOwners[t.key] ?? ''}
                          onCommit={(v) => setTaskOwner(t.key, v)}
                          placeholder="Owner"
                          style={{ width: '150px', flexShrink: 0 }}
                        />
                        <DelButton onClick={() => removeTask(t)} />
                      </div>
                    )
                  })}
                  <AddButton label="Add task" onClick={() => addTaskTo(group)} style={{ marginTop: '4px' }} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Planning summary */}
      <div className="cq-card">
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(var(--fg),0.8)', marginBottom: '4px' }}>From your plan</div>
        <div style={{ fontSize: '12px', color: 'rgba(var(--fg),0.4)', marginBottom: '14px' }}>A snapshot of what you decided earlier. Tap any card to jump back and edit it.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
          {summary.map((s) => {
            const filled = !!s.value
            return (
              <button key={s.label} type="button" className="summary-card" onClick={() => goTo(s.jump)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <s.icon size={16} color="#8FB3C7" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(var(--fg),0.85)' }}>{s.label}</span>
                </div>
                <div style={{ fontSize: '13px', lineHeight: 1.45, color: filled ? (s.color ?? 'rgba(var(--fg),0.72)') : 'rgba(var(--fg),0.35)', fontStyle: filled ? 'normal' : 'italic', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {filled ? s.value : s.empty}
                </div>
                <div style={{ marginTop: '8px', fontSize: '11px', fontWeight: 600, color: filled ? 'var(--accent-text)' : '#fcd34d' }}>{filled ? 'Edit →' : 'Add →'}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Workstream owners */}
      <div className="cq-card">
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(var(--fg),0.8)', marginBottom: '12px' }}>Workstream owners</div>
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
