import { useEffect, useState } from 'react'
import { ArrowRight, ChevronDown, ChevronRight, Share2 } from 'lucide-react'
import { useStageEditor } from '@/state/AppContext'
import { useShare } from '@/state/ShareContext'
import { AddButton, DelButton, TextInput } from '@/components/ui'
import { collectLaunchTasks, preparedness, type PrepTask } from '@/lib/format'
import { uid } from '@/lib/id'

// Green once meaningfully on track (>70%), amber mid, red low, green reads as
// good progress rather than a warning.
const prepColor = (p: number) => (p >= 70 ? '#22c55e' : p >= 40 ? '#f59e0b' : '#ef4444')
const shortDate = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
/** Today as a local yyyy-mm-dd string, for comparing against task due dates. */
const todayISO = () => {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
}
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
]

/** Display labels for task groups (keys above stay stable for the data layer). */
const GROUP_LABELS: Record<string, string> = {
  'Launch readiness': 'Go-live checklist', // avoid clashing with the "Launch Preparedness" score label
  'Your tasks': 'Additional tasks',
  'Stakeholders': 'Key people',
  'Resistance': 'Pushback',
  'Dependencies': 'Things you’re waiting on',
  'Impacted groups': 'Who’s affected',
}
const labelFor = (g: string) => GROUP_LABELS[g] ?? g

/** One dot on the launch timeline: a dated task, or the go-live milestone. */
interface TimelineEntry {
  date: string
  label: string
  group: string
  owner: string
  done: boolean
  milestone: boolean
}

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
  // The countdown falls back to the target date entered at project creation
  // when no explicit go-live date has been set here (matches the brief/report).
  const goLiveDate = milestones.goLiveDate || project.targetDate

  // The next 5 open tasks that have a due date, soonest first (overdue included).
  const today = todayISO()
  const upcoming = tasks
    .filter((t) => !t.done && t.due)
    .sort((a, b) => (a.due! < b.due! ? -1 : a.due! > b.due! ? 1 : 0))
    .slice(0, 5)

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

  const hiddenTasks = milestones.hiddenTasks ?? []
  const restoreHidden = () => updateMilestones({ hiddenTasks: [] })
  // A row's remove button: truly delete user-added tasks, just hide derived ones
  // (their planning data is untouched). Done atomically so removing the last item
  // and re-seeding a blank field don't race on stale state.
  const removeTask = (t: PrepTask) => {
    // Removing the last item would collapse the section; keep one blank field
    // so the section stays open and usable.
    const remaining = tasks.filter((x) => x.group === t.group && x.key !== t.key).length
    const keepOpen = remaining === 0 && t.group !== 'Your tasks'
    let customTasks = milestones.customTasks
    let hidden = hiddenTasks
    if (t.source === 'custom') customTasks = customTasks.filter((c) => c.id !== t.refId)
    else hidden = hidden.includes(t.key) ? hidden : [...hidden, t.key]
    if (keepOpen) customTasks = [...customTasks, { id: uid(), label: '', done: false, group: t.group }]
    updateMilestones({ customTasks, hiddenTasks: hidden })
  }

  // Owner name per task, keyed by the task's stable key — works for every source.
  const taskOwners = milestones.taskOwners ?? {}
  const setTaskOwner = (key: string, name: string) =>
    updateMilestones({ taskOwners: { ...taskOwners, [key]: name } })
  // Due date (ISO) per task, same keying as owners.
  const taskDueDates = milestones.taskDueDates ?? {}
  const setTaskDue = (key: string, due: string) =>
    updateMilestones({ taskDueDates: { ...taskDueDates, [key]: due } })
  // Raw custom-task labels for inline editing (PrepTask.label bakes in a fallback).
  const customById = new Map(milestones.customTasks.map((c) => [c.id, c]))

  // Timeline: every dated task (plus the go-live milestone) in date order,
  // grouped by date so items sharing a day sit under one marker.
  const timelineItems: TimelineEntry[] = [
    ...tasks
      .filter((t) => !!t.due)
      .map((t) => ({ date: t.due!, label: t.label, group: labelFor(t.group), owner: t.owner ?? '', done: t.done, milestone: false })),
    ...(goLiveDate ? [{ date: goLiveDate, label: 'Go-live', group: '', owner: '', done: false, milestone: true }] : []),
  ].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  const timeline: { date: string; items: TimelineEntry[] }[] = []
  for (const it of timelineItems) {
    const last = timeline[timeline.length - 1]
    if (last && last.date === it.date) last.items.push(it)
    else timeline.push({ date: it.date, items: [it] })
  }

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
            <GoLiveCountdown date={goLiveDate} />
          </div>
          <div style={{ width: '180px', flexShrink: 0 }}>
            <div className="cq-lbl">Target date</div>
            <input type="date" className="cq-input" value={goLiveDate} onChange={(e) => updateMilestones({ goLiveDate: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Next up: the soonest-due open tasks, so the team sees what's next at a glance. */}
      <div className="cq-card">
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(var(--fg),0.8)', marginBottom: '4px' }}>Next up</div>
        <div style={{ fontSize: '12px', color: 'rgba(var(--fg),0.4)', marginBottom: '14px' }}>Your next 5 actions by due date.</div>
        {upcoming.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'rgba(var(--fg),0.45)', fontStyle: 'italic' }}>
            Add due dates to your launch tasks below to see what’s coming up next.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
            {upcoming.map((t) => {
              const overdue = !!t.due && t.due < today
              return (
                <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 12px', background: 'rgba(var(--fg),0.02)', border: '1px solid rgba(var(--fg),0.06)', borderRadius: '8px' }}>
                  <div style={{ width: '54px', flexShrink: 0, fontSize: '13px', fontWeight: 700, color: overdue ? '#ef4444' : 'var(--accent-text)', fontVariantNumeric: 'tabular-nums' }}>{shortDate(t.due!)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', color: 'rgba(var(--fg),0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.label}</div>
                    <div style={{ fontSize: '11.5px', color: 'rgba(var(--fg),0.45)', marginTop: '1px' }}>{labelFor(t.group)}{t.owner ? ` · ${t.owner}` : ''}</div>
                  </div>
                  {overdue && <span style={{ flexShrink: 0, fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#fca5a5', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '3px 7px' }}>Overdue</span>}
                </div>
              )
            })}
          </div>
        )}
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
          // Order each group by due date (soonest first); undated tasks keep
          // their natural order at the end, so entering a date re-sorts the row.
          const items = tasks
            .filter((t) => t.group === group)
            .map((t, i) => ({ t, i }))
            .sort((a, b) => {
              const da = taskDueDates[a.t.key] ?? ''
              const db = taskDueDates[b.t.key] ?? ''
              if (da && db) return da < db ? -1 : da > db ? 1 : a.i - b.i
              if (da) return -1
              if (db) return 1
              return a.i - b.i
            })
            .map((x) => x.t)
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
                          style={{ width: '130px', flexShrink: 0 }}
                        />
                        <input
                          type="date"
                          className="cq-input"
                          value={taskDueDates[t.key] ?? ''}
                          onChange={(e) => setTaskDue(t.key, e.target.value)}
                          aria-label="Due date"
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

      {/* Timeline: everything dated, in order */}
      <div className="cq-card">
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(var(--fg),0.8)', marginBottom: '4px' }}>Timeline</div>
        <div style={{ fontSize: '12px', color: 'rgba(var(--fg),0.4)', marginBottom: '16px' }}>Every launch item with a date, in order, plus your go-live.</div>
        {timeline.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'rgba(var(--fg),0.45)', fontStyle: 'italic' }}>
            No dated items yet, set due dates on your launch tasks above to build the timeline.
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* Continuous rail behind the date markers. */}
            <div style={{ position: 'absolute', left: '63px', top: '6px', bottom: '6px', width: '2px', background: 'rgba(var(--fg),0.12)' }} />
            {timeline.map((grp) => {
              const overdue = grp.date < today
              return (
                <div key={grp.date} style={{ position: 'relative', display: 'flex', marginBottom: '16px' }}>
                  <div style={{ width: '56px', flexShrink: 0, textAlign: 'right', paddingTop: '2px', fontSize: '12px', fontWeight: 700, color: overdue ? '#ef4444' : 'var(--accent-text)', fontVariantNumeric: 'tabular-nums' }}>
                    {shortDate(grp.date)}
                  </div>
                  <div style={{ position: 'absolute', left: '57px', top: '3px', width: '14px', height: '14px', borderRadius: '50%', border: '2px solid var(--surface-card)', background: overdue ? '#ef4444' : 'var(--accent-text)' }} />
                  <div style={{ flex: 1, minWidth: 0, marginLeft: '30px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {grp.items.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: it.milestone ? 'rgba(91,134,163,0.1)' : 'rgba(var(--fg),0.02)', border: `1px solid ${it.milestone ? 'rgba(91,134,163,0.3)' : 'rgba(var(--fg),0.06)'}`, borderRadius: '8px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: it.milestone ? 700 : 400, color: it.done ? 'rgba(var(--fg),0.4)' : 'rgba(var(--fg),0.85)', textDecoration: it.done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {it.milestone ? '🚀 ' : ''}{it.label}
                          </div>
                          {!it.milestone && (
                            <div style={{ fontSize: '11.5px', color: 'rgba(var(--fg),0.45)', marginTop: '1px' }}>{it.group}{it.owner ? ` · ${it.owner}` : ''}</div>
                          )}
                        </div>
                        {it.done && <span style={{ flexShrink: 0, fontSize: '11px', color: '#86efac', fontWeight: 700 }}>✓ Done</span>}
                        {!it.done && overdue && !it.milestone && (
                          <span style={{ flexShrink: 0, fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#fca5a5', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '3px 7px' }}>Overdue</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
