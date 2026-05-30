import type { CSSProperties } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import { useStageEditor } from '@/state/AppContext'
import type { ImpactedGroup, Impact, Readiness } from '@/types'
import { InsightCallout, Label, TextInput } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { coaching } from '@/data/coaching'
import { uid } from '@/lib/id'

interface LevelOption<T extends string> {
  value: T
  label: string
  desc: string
}

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

/** Big, explained option cards — replaces a bare dropdown for a guided feel. */
function LevelPicker<T extends string>({ value, options, onChange }: { value: T; options: LevelOption<T>[]; onChange: (v: T) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {options.map((o) => {
        const sel = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              textAlign: 'left',
              width: '100%',
              background: sel ? 'rgba(91,134,163,0.12)' : 'rgba(var(--fg),0.02)',
              border: `1.5px solid ${sel ? '#5B86A3' : 'rgba(var(--fg),0.1)'}`,
              borderRadius: '12px',
              padding: '14px 16px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                flexShrink: 0,
                marginTop: '1px',
                border: `2px solid ${sel ? '#5B86A3' : 'rgba(var(--fg),0.25)'}`,
                background: sel ? '#5B86A3' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {sel && <Check size={12} strokeWidth={3} color="var(--on-accent)" />}
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '3px' }}>{o.label}</div>
              <div style={{ fontSize: '13px', color: 'rgba(var(--fg),0.7)', lineHeight: 1.5 }}>{o.desc}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

const headline: CSSProperties = { margin: '0 0 12px', fontSize: '24px', lineHeight: 1.3, fontWeight: 800, color: 'var(--text)' }
const whyStyle: CSSProperties = { fontSize: '15px', color: 'rgba(var(--fg),0.72)', lineHeight: 1.7, margin: '0 0 22px' }
const addBtn: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '18px',
  background: 'rgba(91,134,163,0.12)', border: '1px solid rgba(91,134,163,0.35)', borderRadius: '999px',
  padding: '9px 16px', color: 'var(--accent-text)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
}
const removeBtn: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '16px',
  background: 'none', border: 'none', color: 'rgba(var(--fg),0.45)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
}

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
          <button type="button" style={{ ...addBtn, marginTop: 0 }} onClick={addGroup}>
            <Plus size={15} /> Add your first group
          </button>
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
          {data.groups.length > 1 && (
            <button type="button" style={removeBtn} onClick={() => delGroup(g.id)}>
              <Trash2 size={13} /> Remove this group
            </button>
          )}
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
          {isLast && (
            <button type="button" style={addBtn} onClick={addGroup}>
              <Plus size={15} /> Add another group, then press Next
            </button>
          )}
        </div>
      ),
    })
  })

  return <StageFlow stageId="groups" icon={coaching.groups.icon} blurb={coaching.groups.intro} steps={steps} />
}
