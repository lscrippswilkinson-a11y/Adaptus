import { useStageEditor } from '@/state/AppContext'
import type { ImpactedGroup, Impact, Readiness } from '@/types'
import { InsightCallout, Label, TextInput } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { AddAnotherButton, AddItemButton, LevelPicker, RemoveItemButton, headline, whyStyle, type LevelOption } from '@/components/guided'
import { coaching } from '@/data/coaching'
import { uid } from '@/lib/id'

const IMPACT_LEVELS: LevelOption<Impact>[] = [
  { value: 'High', label: 'High impact', desc: 'Reshapes their daily work — new tools, new steps, or a changed role. They feel it constantly.' },
  { value: 'Medium', label: 'Medium impact', desc: 'Part of their process changes, but much of their day stays the same.' },
  { value: 'Low', label: 'Low impact', desc: 'Barely touched — they may notice it, but their day-to-day is essentially unchanged.' },
]

const READINESS_LEVELS: LevelOption<Readiness>[] = [
  { value: 'High', label: 'High readiness', desc: 'Aware it’s coming, on board with the why, and have the time and skills to adapt.' },
  { value: 'Medium', label: 'Medium readiness', desc: 'Some awareness and willingness, but mixed — a few are hesitant or stretched thin.' },
  { value: 'Low', label: 'Low readiness', desc: 'Largely unaware, skeptical, or already overloaded — little capacity to take this on right now.' },
]

export function GroupsStage() {
  const { data, update } = useStageEditor('groups')
  const w = coaching.groups.wizard

  const setGroup = (id: number, patch: Partial<ImpactedGroup>) =>
    update({ groups: data.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)) })
  const delGroup = (id: number) => update({ groups: data.groups.filter((g) => g.id !== id) })
  const addGroup = () => update({ groups: [...data.groups, { id: uid(), name: '', size: '', impact: 'High', readiness: 'Low' }] })

  const steps: WizardStep[] = []

  if (data.groups.length === 0) {
    // Empty-state screen: nothing to walk through yet, so invite the first group.
    steps.push({
      id: 'start',
      title: 'Add your first group',
      isFilled: false,
      node: (
        <div>
          <h2 style={headline}>{w.name.label}</h2>
          <div style={whyStyle}>{w.name.why}</div>
          <AddItemButton label="Add your first group" onClick={addGroup} />
        </div>
      ),
    })
  }

  data.groups.forEach((g, i) => {
    const name = g.name.trim() || `Group ${i + 1}`
    const isLast = i === data.groups.length - 1
    const impactDesc = IMPACT_LEVELS.find((o) => o.value === g.impact)?.label ?? g.impact
    const readyDesc = READINESS_LEVELS.find((o) => o.value === g.readiness)?.label ?? g.readiness
    const insight = coaching.groups.insight(g)

    // Screen 1 — name (+ rough size)
    steps.push({
      id: `${g.id}-name`,
      title: `${name}: name & size`,
      isFilled: !!g.name.trim(),
      summary: g.name ? (g.size ? `${g.name} (~${g.size})` : g.name) : undefined,
      node: (
        <div>
          <h2 style={headline}>{w.name.label}</h2>
          <div style={whyStyle}>{w.name.why}</div>
          <Label>Group name</Label>
          <TextInput value={g.name} onCommit={(v) => setGroup(g.id, { name: v })} placeholder="e.g., Billing team" />
          <div style={{ marginTop: '14px' }}>
            <Label>About how many people? (optional)</Label>
            <TextInput value={g.size} onCommit={(v) => setGroup(g.id, { size: v })} placeholder="e.g., 18" />
          </div>
          {data.groups.length > 1 && <RemoveItemButton label="Remove this group" onClick={() => delGroup(g.id)} />}
        </div>
      ),
    })

    // Screen 2 — impact
    steps.push({
      id: `${g.id}-impact`,
      title: `${name}: impact`,
      isFilled: !!g.name.trim(),
      summary: `${impactDesc}`,
      node: (
        <div>
          <h2 style={headline}>How much does this change {g.name.trim() ? `the ${g.name.trim()}’s` : 'their'} day-to-day work?</h2>
          <div style={whyStyle}>{w.impact.why}</div>
          <LevelPicker value={g.impact} options={IMPACT_LEVELS} onChange={(v) => setGroup(g.id, { impact: v })} />
        </div>
      ),
    })

    // Screen 3 — readiness (+ the live insight once both are set)
    steps.push({
      id: `${g.id}-readiness`,
      title: `${name}: readiness`,
      isFilled: !!g.name.trim(),
      summary: `${readyDesc}`,
      node: (
        <div>
          <h2 style={headline}>How ready is {g.name.trim() ? `the ${g.name.trim()}` : 'this group'} for the change?</h2>
          <div style={whyStyle}>{w.readiness.why}</div>
          <LevelPicker value={g.readiness} options={READINESS_LEVELS} onChange={(v) => setGroup(g.id, { readiness: v })} />
          {insight && <InsightCallout tone={insight.tone} style={{ marginTop: '16px' }}>{insight.text}</InsightCallout>}
          {isLast && <AddAnotherButton label="Add another group" onAdd={addGroup} />}
        </div>
      ),
    })
  })

  return <StageFlow stageId="groups" icon={coaching.groups.icon} blurb={coaching.groups.intro} steps={steps} />
}
