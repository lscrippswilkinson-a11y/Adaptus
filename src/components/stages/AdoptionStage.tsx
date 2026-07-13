import { useStageEditor } from '@/state/AppContext'
import type { AdoptionMetric } from '@/types'
import { FieldCoach, InsightCallout, Label, TextArea, TextInput } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { useWizardMode } from '@/state/WizardModeContext'
import { AddAnotherButton, AddItemButton, ChipPicker, GuidedLabel, RemoveItemButton, headline, whyStyle } from '@/components/guided'
import { METRIC_UNITS } from '@/data/constants'
import { coaching } from '@/data/coaching'
import { uid } from '@/lib/id'

export function AdoptionStage() {
  const { data, update } = useStageEditor('adoption')
  const { mode } = useWizardMode()
  const w = coaching.adoption.wizard

  const setMetric = (id: number, patch: Partial<AdoptionMetric>) =>
    update({ metrics: data.metrics.map((m) => (m.id === id ? { ...m, ...patch } : m)) })
  const delMetric = (id: number) => update({ metrics: data.metrics.filter((m) => m.id !== id) })
  const addMetric = () => update({ metrics: [...data.metrics, { id: uid(), name: '', target: '', current: '', unit: '%' }] })

  const insight = coaching.adoption.insight(data.metrics)

  const steps: WizardStep[] = []

  if (data.metrics.length === 0) {
    steps.push({
      id: 'start',
      title: 'Add your first metric',
      isFilled: false,
      node: (
        <div>
          <h2 style={headline}>{w.name.label}</h2>
          <div style={whyStyle}>{w.name.why}</div>
          <AddItemButton label="Add your first adoption metric" onClick={addMetric} />
        </div>
      ),
    })
  }

  data.metrics.forEach((m, i) => {
    const what = m.name.trim() || `Metric ${i + 1}`
    const isLast = i === data.metrics.length - 1
    const hasProgress = m.current && m.target
    const p2 = hasProgress ? Math.min(100, Math.round((parseFloat(m.current) / parseFloat(m.target)) * 100)) : 0

    // Screen 1: name + unit
    steps.push({
      id: `${m.id}-name`,
      title: `${what}: metric & unit`,
      isFilled: !!m.name.trim(),
      summary: m.name ? `${m.name} (${m.unit})` : undefined,
      node: (
        <div>
          <h2 style={headline}>{w.name.label}</h2>
          <div style={whyStyle}>{w.name.why}</div>
          <Label>Metric name</Label>
          <TextInput value={m.name} onCommit={(v) => setMetric(m.id, { name: v })} placeholder="e.g., Timekeepers entering their own time" />
          <div style={{ marginTop: '18px' }}>
            <GuidedLabel>How is it measured?</GuidedLabel>
            <ChipPicker value={m.unit} options={METRIC_UNITS} onChange={(v) => setMetric(m.id, { unit: v })} />
          </div>
          {data.metrics.length > 1 && <RemoveItemButton label="Remove this metric" onClick={() => delMetric(m.id)} />}
        </div>
      ),
    })

    // Screen 2: target
    steps.push({
      id: `${m.id}-target`,
      title: `${what}: target`,
      isFilled: !!m.name.trim(),
      summary: m.target ? `Target ${m.target}${m.unit}` : undefined,
      node: (
        <div>
          <h2 style={headline}>What’s the target?</h2>
          <div style={whyStyle}>{w.targets.why}</div>
          <Label>Target ({m.unit})</Label>
          <TextInput value={m.target} onCommit={(v) => setMetric(m.id, { target: v })} placeholder="e.g., 90" />
        </div>
      ),
    })

    // Screen 3: current (+ progress, insight on the last)
    steps.push({
      id: `${m.id}-current`,
      title: `${what}: current`,
      isFilled: !!m.name.trim(),
      summary: m.target ? `${m.current || '-'} / ${m.target}${m.unit}` : undefined,
      node: (
        <div>
          <h2 style={headline}>Where are you now?</h2>
          <div style={whyStyle}>{w.targets.why}</div>
          <Label>Current ({m.unit})</Label>
          <TextInput value={m.current} onCommit={(v) => setMetric(m.id, { current: v })} placeholder="e.g., 55" />
          {hasProgress && (
            <div style={{ marginTop: '14px' }}>
              <div style={{ height: '6px', background: 'rgba(var(--fg),0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${p2}%`, background: 'linear-gradient(90deg,#5B86A3,#8FB3C7)', borderRadius: '3px', transition: 'width 0.4s' }} />
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(var(--fg),0.35)', marginTop: '3px' }}>{p2}% of target</div>
            </div>
          )}
          {mode === 'guided' && isLast && insight && (
            <InsightCallout tone={insight.tone} style={{ marginTop: '16px' }}>{insight.text}</InsightCallout>
          )}
          {isLast && <AddAnotherButton label="Add another metric" onAdd={addMetric} />}
        </div>
      ),
    })
  })

  // Final step: the qualitative "what are you hearing" notes, independent of metrics.
  steps.push({
    id: 'notes',
    title: 'From the field',
    isFilled: !!data.notes.trim(),
    summary: data.notes || undefined,
    node: (
      <FieldCoach label={coaching.adoption.fields.notes.label} why={coaching.adoption.fields.notes.why}>
        <TextArea value={data.notes} onCommit={(v) => update({ notes: v })} placeholder={coaching.adoption.fields.notes.example} rows={4} />
      </FieldCoach>
    ),
  })

  return (
    <StageFlow
      stageId="adoption"
      icon={coaching.adoption.icon}
      blurb={coaching.adoption.intro}
      extra={insight ? <InsightCallout tone={insight.tone} style={{ marginBottom: '12px' }}>{insight.text}</InsightCallout> : undefined}
      steps={steps}
    />
  )
}
