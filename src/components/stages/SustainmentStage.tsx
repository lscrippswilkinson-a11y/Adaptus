import { useStageEditor } from '@/state/AppContext'
import { FieldCoach, InsightCallout, TextArea, TextInput } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { coaching } from '@/data/coaching'

export function SustainmentStage() {
  const { data, update } = useStageEditor('sustainment')
  const f = coaching.sustainment.fields

  const steps: WizardStep[] = [
    {
      id: 'reinforcementOwner',
      title: 'Who keeps it alive',
      isFilled: !!data.reinforcementOwner.trim(),
      summary: data.reinforcementOwner,
      node: (
        <FieldCoach label={f.reinforcementOwner.label} why={f.reinforcementOwner.why}>
          {/* One-liner: the field wants a name, so the short example is the one that fits. */}
          <TextInput value={data.reinforcementOwner} onCommit={(v) => update({ reinforcementOwner: v })} placeholder="e.g., Operations Manager, or a team lead" />
        </FieldCoach>
      ),
    },
    {
      id: 'checkpointDates',
      title: 'Checkpoints',
      isFilled: !!data.checkpointDates.trim(),
      summary: data.checkpointDates,
      node: (
        <FieldCoach label={f.checkpointDates.label} why={f.checkpointDates.why}>
          <TextArea value={data.checkpointDates} onCommit={(v) => update({ checkpointDates: v })} placeholder={f.checkpointDates.example} rows={3} />
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
          <TextArea value={data.metrics} onCommit={(v) => update({ metrics: v })} placeholder={f.metrics.example} rows={3} />
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
          <TextArea value={data.risks} onCommit={(v) => update({ risks: v })} placeholder={f.risks.example} rows={3} />
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
          <TextArea value={data.recognitionPlan} onCommit={(v) => update({ recognitionPlan: v })} placeholder={f.recognitionPlan.example} rows={4} />
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
