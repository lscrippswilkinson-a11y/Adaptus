import { useStageEditor } from '@/state/AppContext'
import { asExample, FieldCoach, InsightCallout, Label, TextArea, TextInput } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { coaching } from '@/data/coaching'
import { longDate } from '@/components/stages/TrainingStage'
import type { SustainmentData } from '@/types'

/** The three review points, 30/60/90 days after go-live. */
const checkpoints: { key: 'checkpoint30' | 'checkpoint60' | 'checkpoint90'; label: string }[] = [
  { key: 'checkpoint30', label: '30-day review' },
  { key: 'checkpoint60', label: '60-day review' },
  { key: 'checkpoint90', label: '90-day review' },
]

export function SustainmentStage() {
  const { data, update } = useStageEditor('sustainment')
  const f = coaching.sustainment.fields
  const setCheckpoints = checkpoints.filter((c) => !!(data as SustainmentData)[c.key])

  const steps: WizardStep[] = [
    {
      id: 'reinforcementOwner',
      title: 'Who keeps it alive',
      isFilled: !!data.reinforcementOwner.trim(),
      summary: data.reinforcementOwner,
      node: (
        <FieldCoach label={f.reinforcementOwner.label} why={f.reinforcementOwner.why}>
          {/* One-liner: the field wants a name, so the short example is the one that fits. */}
          <TextInput value={data.reinforcementOwner} onCommit={(v) => update({ reinforcementOwner: v })} placeholder="Example: Operations Manager, or a team lead" />
        </FieldCoach>
      ),
    },
    {
      id: 'checkpointDates',
      title: 'Checkpoints',
      isFilled: checkpoints.some((c) => !!data[c.key]),
      summary: setCheckpoints.length ? setCheckpoints.map((c) => `${c.label}: ${longDate(data[c.key])}`).join('  ·  ') : undefined,
      emptyLabel: 'No review dates set',
      node: (
        <FieldCoach label={f.checkpointDates.label} why={f.checkpointDates.why}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {checkpoints.map((c) => (
              <div key={c.key} style={{ flex: '1 1 160px', minWidth: 0 }}>
                <Label>{c.label}</Label>
                <input
                  type="date"
                  className="cq-input"
                  value={data[c.key]}
                  onChange={(e) => update({ [c.key]: e.target.value })}
                  aria-label={`${c.label} date`}
                />
              </div>
            ))}
          </div>

          {/* Checkpoints typed as free text before these pickers existed: shown so
              nothing a user wrote is lost, and they can copy the dates across. */}
          {data.checkpointDates.trim() && (
            <div style={{ marginTop: '14px', fontSize: '13px', color: 'rgba(var(--fg),0.6)', lineHeight: 1.6 }}>
              <span style={{ fontWeight: 600 }}>You noted earlier:</span> {data.checkpointDates}
            </div>
          )}
        </FieldCoach>
      ),
    },
    {
      id: 'metrics',
      title: 'What you’ll watch',
      isFilled: !!data.metrics.trim(),
      summary: data.metrics,
      node: (
        <FieldCoach label={f.metrics.label} why={f.metrics.why}>
          <TextArea value={data.metrics} onCommit={(v) => update({ metrics: v })} placeholder={asExample(f.metrics.example)} rows={3} />
        </FieldCoach>
      ),
    },
    {
      id: 'risks',
      title: 'What could pull it back',
      isFilled: !!data.risks.trim(),
      summary: data.risks,
      node: (
        <FieldCoach label={f.risks.label} why={f.risks.why}>
          <TextArea value={data.risks} onCommit={(v) => update({ risks: v })} placeholder={asExample(f.risks.example)} rows={3} />
        </FieldCoach>
      ),
    },
    {
      id: 'recognitionPlan',
      title: 'Recognition',
      isFilled: !!data.recognitionPlan.trim(),
      summary: data.recognitionPlan,
      node: (
        <FieldCoach label={f.recognitionPlan.label} why={f.recognitionPlan.why}>
          <TextArea value={data.recognitionPlan} onCommit={(v) => update({ recognitionPlan: v })} placeholder={asExample(f.recognitionPlan.example)} rows={4} />
        </FieldCoach>
      ),
    },
  ]

  return (
    <StageFlow
      stageId="sustainment"
      icon={coaching.sustainment.icon}
      blurb={coaching.sustainment.intro}
      extra={
        <InsightCallout tone={coaching.sustainment.topNote.tone} style={{ marginBottom: '12px' }}>
          {coaching.sustainment.topNote.text}
        </InsightCallout>
      }
      steps={steps}
    />
  )
}
