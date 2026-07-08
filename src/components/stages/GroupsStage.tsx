import { ChevronRight, Trash2 } from 'lucide-react'
import { useStageEditor } from '@/state/AppContext'
import type { ImpactedGroup, Impact, Readiness } from '@/types'
import { InsightCallout, Label, TextInput } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { AddItemButton, LevelPicker, RemoveItemButton, headline, whyStyle, type LevelOption } from '@/components/guided'
import { coaching } from '@/data/coaching'
import { getBusinessProfile } from '@/data/business'
import { uid } from '@/lib/id'

const IMPACT_LEVELS: LevelOption<Impact>[] = [
  { value: 'High', label: 'High impact', desc: 'Reshapes their daily work: new tools, new steps, or a changed role. They feel it constantly.' },
  { value: 'Medium', label: 'Medium impact', desc: 'Part of their process changes, but much of their day stays the same.' },
  { value: 'Low', label: 'Low impact', desc: 'Barely touched, they may notice it, but their day-to-day is essentially unchanged.' },
]

const READINESS_LEVELS: LevelOption<Readiness>[] = [
  { value: 'High', label: 'High readiness', desc: 'Aware it’s coming, on board with the why, and have the time and skills to adapt.' },
  { value: 'Medium', label: 'Medium readiness', desc: 'Some awareness and willingness, but mixed; a few are hesitant or stretched thin.' },
  { value: 'Low', label: 'Low readiness', desc: 'Largely unaware, skeptical, or already overloaded; little capacity to take this on right now.' },
]

const impactLabelOf = (v: Impact) => IMPACT_LEVELS.find((o) => o.value === v)?.label ?? v
const readyLabelOf = (v: Readiness) => READINESS_LEVELS.find((o) => o.value === v)?.label ?? v

/**
 * The "group summary" hub: the home base of the guided groups flow. Lists every
 * group added so far (tap to edit), offers "Add another group", and, via the
 * Workspace complete button below, lets the user continue to the next stage.
 * Editing or adding a group walks its screens and returns here when finished.
 */
function GroupsHub({
  groups,
  editItem,
  onAdd,
  onRemove,
}: {
  groups: ImpactedGroup[]
  editItem: (stepIndex: number) => void
  onAdd: () => void
  onRemove: (id: number) => void
}) {
  return (
    <div>
      <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 800, color: 'var(--text)' }}>
        {groups.length ? 'Your impacted groups' : 'Add your first group'}
      </h2>
      <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'rgba(var(--fg),0.6)', lineHeight: 1.6 }}>
        {groups.length
          ? 'These are the groups this change touches. Tap one to edit it, add another below, or mark this step complete to continue.'
          : coaching.groups.wizard.name.why}
      </p>

      {groups.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {groups.map((g, i) => {
            const insight = coaching.groups.insight(g)
            return (
              <div key={g.id} style={{ border: '1px solid rgba(var(--fg),0.1)', borderRadius: '14px', padding: '14px 16px', background: 'rgba(var(--fg),0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => editItem(i * 3)}
                    style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
                  >
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                        {g.name.trim() || `Group ${i + 1}`}
                        {g.size.trim() ? <span style={{ fontWeight: 400, color: 'rgba(var(--fg),0.45)' }}>, {g.size.trim()} people</span> : null}
                      </span>
                      <span style={{ display: 'block', fontSize: '13px', color: 'rgba(var(--fg),0.6)', marginTop: '3px' }}>
                        Impact: {g.impact} <span style={{ color: 'rgba(var(--fg),0.3)' }}>|</span> Readiness: {g.readiness}
                      </span>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', flexShrink: 0, fontSize: '12px', fontWeight: 600, color: 'var(--accent-text)' }}>
                      Edit <ChevronRight size={14} />
                    </span>
                  </button>
                  {groups.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemove(g.id)}
                      aria-label="Remove group"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(var(--fg),0.35)', padding: '2px', flexShrink: 0, display: 'inline-flex' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                {insight && <InsightCallout tone={insight.tone} style={{ marginTop: '12px' }}>{insight.text}</InsightCallout>}
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: groups.length ? '16px' : 0 }}>
        <AddItemButton label={groups.length ? 'Add another group' : 'Add your first group'} onClick={onAdd} />
      </div>
    </div>
  )
}

export function GroupsStage() {
  const { project, data, update } = useStageEditor('groups')
  const w = coaching.groups.wizard
  // Suggested groups are tailored to the project's business type.
  const suggestedGroups = getBusinessProfile(project?.businessType).suggestedGroups

  const setGroup = (id: number, patch: Partial<ImpactedGroup>) =>
    update({ groups: data.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)) })
  const delGroup = (id: number) => update({ groups: data.groups.filter((g) => g.id !== id) })
  const addGroup = () => update({ groups: [...data.groups, { id: uid(), name: '', size: '', impact: 'Medium', readiness: 'Medium' }] })

  const steps: WizardStep[] = []

  data.groups.forEach((g, i) => {
    const name = g.name.trim() || `Group ${i + 1}`
    const insight = coaching.groups.insight(g)

    // Screen 1: name (+ rough size). First screen of the item → Back returns to the hub.
    steps.push({
      id: `${g.id}-name`,
      title: `${name}: name & size`,
      isFilled: !!g.name.trim(),
      summary: g.name ? (g.size ? `${g.name} (~${g.size})` : g.name) : undefined,
      itemFirst: true,
      node: (
        <div>
          <h2 style={headline}>{w.name.label}</h2>
          <div style={whyStyle}>{w.name.why}</div>
          <Label>Group name</Label>
          <TextInput value={g.name} onCommit={(v) => setGroup(g.id, { name: v })} placeholder="e.g., Billing team" />
          {(() => {
            // Quick-add chips for common groups in this kind of organization, hiding any already used.
            const used = new Set(data.groups.map((x) => x.name.trim().toLowerCase()))
            const chips = suggestedGroups.filter((s) => !used.has(s.toLowerCase()))
            return chips.length > 0 ? (
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '11.5px', color: 'rgba(var(--fg),0.45)', marginBottom: '6px' }}>Common groups, tap to use:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {chips.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setGroup(g.id, { name: s })}
                      style={{ fontSize: '12px', color: 'var(--accent-text)', background: 'rgba(91,134,163,0.12)', border: '1px solid rgba(91,134,163,0.3)', borderRadius: '999px', padding: '5px 11px', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : null
          })()}
          <div style={{ marginTop: '14px' }}>
            <Label>About how many people? (optional)</Label>
            <TextInput value={g.size} onCommit={(v) => setGroup(g.id, { size: v })} placeholder="e.g., 18" />
          </div>
          {data.groups.length > 1 && <RemoveItemButton label="Remove this group" onClick={() => delGroup(g.id)} />}
        </div>
      ),
    })

    // Screen 2: impact
    steps.push({
      id: `${g.id}-impact`,
      title: `${name}: impact`,
      isFilled: !!g.name.trim(),
      summary: impactLabelOf(g.impact),
      node: (
        <div>
          <h2 style={headline}>How much does this change {g.name.trim() ? `the ${g.name.trim()}’s` : 'their'} day-to-day work?</h2>
          <div style={whyStyle}>{w.impact.why}</div>
          <LevelPicker value={g.impact} options={IMPACT_LEVELS} onChange={(v) => setGroup(g.id, { impact: v })} />
        </div>
      ),
    })

    // Screen 3: readiness (+ the live insight). Last screen of the item → "Done" returns to the hub.
    steps.push({
      id: `${g.id}-readiness`,
      title: `${name}: readiness`,
      isFilled: !!g.name.trim(),
      summary: readyLabelOf(g.readiness),
      itemLast: true,
      node: (
        <div>
          <h2 style={headline}>How ready is {g.name.trim() ? `the ${g.name.trim()}` : 'this group'} for the change?</h2>
          <div style={whyStyle}>{w.readiness.why}</div>
          <LevelPicker value={g.readiness} options={READINESS_LEVELS} onChange={(v) => setGroup(g.id, { readiness: v })} />
          {insight && <InsightCallout tone={insight.tone} style={{ marginTop: '16px' }}>{insight.text}</InsightCallout>}
        </div>
      ),
    })
  })

  return (
    <StageFlow
      stageId="groups"
      icon={coaching.groups.icon}
      blurb={coaching.groups.intro}
      steps={steps}
      hub={({ editItem }) => <GroupsHub groups={data.groups} editItem={editItem} onAdd={addGroup} onRemove={delGroup} />}
    />
  )
}
