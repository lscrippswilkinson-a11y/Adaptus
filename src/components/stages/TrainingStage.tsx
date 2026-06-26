import { useStageEditor } from '@/state/AppContext'
import type { TrainingItem } from '@/types'
import { InsightCallout, Label, TextInput } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { useWizardMode } from '@/state/WizardModeContext'
import { AddAnotherButton, AddItemButton, ChipPicker, GuidedLabel, RemoveItemButton, headline, whyStyle } from '@/components/guided'
import { TRAINING_FORMATS } from '@/data/constants'
import { coaching } from '@/data/coaching'
import { uid } from '@/lib/id'

export function TrainingStage() {
  const { data, update } = useStageEditor('training')
  const { mode } = useWizardMode()
  const w = coaching.training.wizard
  const note = coaching.training.managersFirst

  const setItem = (id: number, patch: Partial<TrainingItem>) =>
    update({ items: data.items.map((t) => (t.id === id ? { ...t, ...patch } : t)) })
  const delItem = (id: number) => update({ items: data.items.filter((t) => t.id !== id) })
  const addItem = () => update({ items: [...data.items, { id: uid(), title: '', audience: '', format: 'Workshop', owner: '', done: false }] })

  const steps: WizardStep[] = []

  if (data.items.length === 0) {
    steps.push({
      id: 'start',
      title: 'Add your first activity',
      isFilled: false,
      node: (
        <div>
          <h2 style={headline}>{w.title.label}</h2>
          <div style={whyStyle}>{w.title.why}</div>
          {mode === 'guided' && <InsightCallout tone={note.tone} style={{ marginBottom: '18px' }}>{note.text}</InsightCallout>}
          <AddItemButton label="Add your first training activity" onClick={addItem} />
        </div>
      ),
    })
  }

  data.items.forEach((t, i) => {
    const what = t.title.trim() || `Activity ${i + 1}`
    const isFirst = i === 0
    const isLast = i === data.items.length - 1

    // Screen 1: title (+ managers-first note on the first)
    steps.push({
      id: `${t.id}-title`,
      title: `${what}: what`,
      isFilled: !!t.title.trim(),
      summary: t.title || undefined,
      node: (
        <div>
          <h2 style={headline}>{w.title.label}</h2>
          <div style={whyStyle}>{w.title.why}</div>
          {mode === 'guided' && isFirst && <InsightCallout tone={note.tone} style={{ marginBottom: '18px' }}>{note.text}</InsightCallout>}
          <Label>Training title</Label>
          <TextInput value={t.title} onCommit={(v) => setItem(t.id, { title: v })} placeholder="e.g., Hands-on Clio time-entry workshop" />
          {data.items.length > 1 && <RemoveItemButton label="Remove this activity" onClick={() => delItem(t.id)} />}
        </div>
      ),
    })

    // Screen 2: audience
    steps.push({
      id: `${t.id}-audience`,
      title: `${what}: audience`,
      isFilled: !!t.title.trim(),
      summary: t.audience || undefined,
      node: (
        <div>
          <h2 style={headline}>{w.audience.label}</h2>
          <div style={whyStyle}>{w.audience.why}</div>
          <Label>Audience</Label>
          <TextInput value={t.audience} onCommit={(v) => setItem(t.id, { audience: v })} placeholder="e.g., All timekeepers" />
        </div>
      ),
    })

    // Screen 3: format
    steps.push({
      id: `${t.id}-format`,
      title: `${what}: format`,
      isFilled: !!t.title.trim(),
      summary: t.format || undefined,
      node: (
        <div>
          <h2 style={headline}>{w.format.label}</h2>
          <div style={whyStyle}>{w.format.why}</div>
          <GuidedLabel>Format</GuidedLabel>
          <ChipPicker value={t.format} options={TRAINING_FORMATS} onChange={(v) => setItem(t.id, { format: v })} />
        </div>
      ),
    })

    // Screen 4: owner (last screen of the item)
    steps.push({
      id: `${t.id}-owner`,
      title: `${what}: owner`,
      isFilled: !!t.title.trim(),
      summary: t.owner ? `led by ${t.owner}` : undefined,
      node: (
        <div>
          <h2 style={headline}>{w.owner.label}</h2>
          <div style={whyStyle}>{w.owner.why}</div>
          <Label>Owner</Label>
          <TextInput value={t.owner} onCommit={(v) => setItem(t.id, { owner: v })} placeholder="Who delivers it?" />
          {isLast && <AddAnotherButton label="Add another training activity" onAdd={addItem} />}
        </div>
      ),
    })
  })

  return (
    <StageFlow
      stageId="training"
      icon={coaching.training.icon}
      blurb={coaching.training.intro}
      extra={<InsightCallout tone={note.tone} style={{ marginBottom: '14px' }}>{note.text}</InsightCallout>}
      steps={steps}
    />
  )
}
