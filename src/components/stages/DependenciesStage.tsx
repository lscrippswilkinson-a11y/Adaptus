import { useStageEditor } from '@/state/AppContext'
import type { Dependency, DependencyStatus, DependencyType } from '@/types'
import { InsightCallout, Label, TextInput } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { useWizardMode } from '@/state/WizardModeContext'
import { AddAnotherButton, AddItemButton, ChipPicker, GuidedLabel, LevelPicker, RemoveItemButton, headline, whyStyle, type LevelOption } from '@/components/guided'
import { coaching } from '@/data/coaching'
import { DEPENDENCY_TYPES } from '@/data/constants'
import { uid } from '@/lib/id'

const STATUS_LEVELS: LevelOption<DependencyStatus>[] = [
  { value: 'Not started', label: 'Not started', desc: 'Hasn’t been kicked off yet.' },
  { value: 'In progress', label: 'In progress', desc: 'Underway, but not finished.' },
  { value: 'Ready', label: 'Ready', desc: 'Done and confirmed, you can count on it.' },
  { value: 'At risk', label: 'At risk', desc: 'In doubt, might not land in time. Chase this one now.' },
]

export function DependenciesStage() {
  const { data, update } = useStageEditor('dependencies')
  const { mode } = useWizardMode()
  const w = coaching.dependencies.wizard

  const setItem = (id: number, patch: Partial<Dependency>) =>
    update({ items: data.items.map((d) => (d.id === id ? { ...d, ...patch } : d)) })
  const delItem = (id: number) => update({ items: data.items.filter((d) => d.id !== id) })
  const addItem = () =>
    update({ items: [...data.items, { id: uid(), name: '', type: 'Team', owner: '', neededBy: '', status: 'Not started' }] })

  const hasAtRisk = data.items.some((d) => d.status === 'At risk')
  const atRiskNote = hasAtRisk ? coaching.dependencies.atRisk : null

  const steps: WizardStep[] = []

  if (data.items.length === 0) {
    steps.push({
      id: 'start',
      title: 'Add the first thing you’re waiting on',
      isFilled: false,
      node: (
        <div>
          <h2 style={headline}>{w.name.label}</h2>
          <div style={whyStyle}>{w.name.why}</div>
          <AddItemButton label="Add the first thing you’re waiting on" onClick={addItem} />
        </div>
      ),
    })
  }

  data.items.forEach((d, i) => {
    const what = d.name.trim() || `Item ${i + 1}`
    const isLast = i === data.items.length - 1

    // Screen 1: name + type
    steps.push({
      id: `${d.id}-name`,
      title: `${what}: what & type`,
      isFilled: !!d.name.trim(),
      summary: d.name ? `${d.name} (${d.type})` : undefined,
      node: (
        <div>
          <h2 style={headline}>{w.name.label}</h2>
          <div style={whyStyle}>{w.name.why}</div>
          <Label>What you’re waiting on</Label>
          <TextInput value={d.name} onCommit={(v) => setItem(d.id, { name: v })} placeholder="Example: IT sets up everyone’s logins" />
          <div style={{ marginTop: '18px' }}>
            <GuidedLabel>What kind is it?</GuidedLabel>
            <ChipPicker value={d.type} options={DEPENDENCY_TYPES} onChange={(v) => setItem(d.id, { type: v as DependencyType })} />
          </div>
          {data.items.length > 1 && <RemoveItemButton label="Remove this item" onClick={() => delItem(d.id)} />}
        </div>
      ),
    })

    // Screen 2: owner
    steps.push({
      id: `${d.id}-owner`,
      title: `${what}: owner`,
      isFilled: !!d.name.trim(),
      summary: d.owner || undefined,
      node: (
        <div>
          <h2 style={headline}>Who owns it?</h2>
          <div style={whyStyle}>{w.detail.why}</div>
          <Label>Owner: who’s responsible?</Label>
          <TextInput value={d.owner} onCommit={(v) => setItem(d.id, { owner: v })} placeholder="Example: IT - Priya" />
        </div>
      ),
    })

    // Screen 3: needed by
    steps.push({
      id: `${d.id}-date`,
      title: `${what}: needed by`,
      isFilled: !!d.name.trim(),
      summary: d.neededBy ? `by ${d.neededBy}` : undefined,
      node: (
        <div>
          <h2 style={headline}>When do you need it?</h2>
          <div style={whyStyle}>{w.detail.why}</div>
          <Label>Needed by</Label>
          <input type="date" className="cq-input" value={d.neededBy} onChange={(e) => setItem(d.id, { neededBy: e.target.value })} />
        </div>
      ),
    })

    // Screen 3: status (+ at-risk note on the last)
    steps.push({
      id: `${d.id}-status`,
      title: `${what}: status`,
      isFilled: !!d.name.trim(),
      summary: d.status,
      node: (
        <div>
          <h2 style={headline}>Where does it stand right now?</h2>
          <div style={whyStyle}>{w.status.why}</div>
          <LevelPicker value={d.status} options={STATUS_LEVELS} onChange={(v) => setItem(d.id, { status: v })} />
          {mode === 'guided' && isLast && atRiskNote && (
            <InsightCallout tone={atRiskNote.tone} style={{ marginTop: '16px' }}>{atRiskNote.text}</InsightCallout>
          )}
          {isLast && <AddAnotherButton label="Add another thing you’re waiting on" onAdd={addItem} />}
        </div>
      ),
    })
  })

  return (
    <StageFlow
      stageId="dependencies"
      icon={coaching.dependencies.icon}
      blurb={coaching.dependencies.intro}
      extra={atRiskNote ? <InsightCallout tone={atRiskNote.tone} style={{ marginBottom: '14px' }}>{atRiskNote.text}</InsightCallout> : undefined}
      steps={steps}
    />
  )
}
