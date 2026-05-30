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
        <FieldCoach
          label={f.reinforcementOwner.label}
          why={f.reinforcementOwner.why}
          example={f.reinforcementOwner.example}
          onUseExample={() => update({ reinforcementOwner: f.reinforcementOwner.example })}
        >
          <TextInput value={data.reinforcementOwner} onCommit={(v) => update({ reinforcementOwner: v })} placeholder="e.g., Operations Manager, HR Business Partner" />
        </FieldCoach>
      ),
    },
    {
      id: 'checkpointDates',
      title: 'Checkpoints',
      isFilled: !!data.checkpointDates.trim(),
      summary: data.checkpointDates,
      node: (
        <FieldCoach
          label={f.checkpointDates.label}
          why={f.checkpointDates.why}
          example={f.checkpointDates.example}
          onUseExample={() => update({ checkpointDates: f.checkpointDates.example })}
        >
          <TextArea value={data.checkpointDates} onCommit={(v) => update({ checkpointDates: v })} placeholder="e.g., 30-day: Oct 15 · 60-day: Nov 15 · 90-day: Dec 15" rows={3} />
        </FieldCoach>
      ),
    },
    {
      id: 'metrics',
      title: 'What you’ll watch',
      isFilled: !!data.metrics.trim(),
      summary: data.metrics,
      node: (
        <FieldCoach
          label={f.metrics.label}
          why={f.metrics.why}
          example={f.metrics.example}
          onUseExample={() => update({ metrics: f.metrics.example })}
        >
          <TextArea value={data.metrics} onCommit={(v) => update({ metrics: v })} placeholder="e.g., Monthly login rate stays above 85%, no return to manual reporting..." rows={3} />
        </FieldCoach>
      ),
    },
    {
      id: 'risks',
      title: 'What could pull it back',
      isFilled: !!data.risks.trim(),
      summary: data.risks,
      node: (
        <FieldCoach
          label={f.risks.label}
          why={f.risks.why}
          example={f.risks.example}
          onUseExample={() => update({ risks: f.risks.example })}
        >
          <TextArea value={data.risks} onCommit={(v) => update({ risks: v })} placeholder="e.g., New untrained manager, peak season pressure, competing priority rollouts..." rows={3} />
        </FieldCoach>
      ),
    },
    {
      id: 'recognitionPlan',
      title: 'Recognition',
      isFilled: !!data.recognitionPlan.trim(),
      summary: data.recognitionPlan,
      node: (
        <FieldCoach
          label={f.recognitionPlan.label}
          why={f.recognitionPlan.why}
          example={f.recognitionPlan.example}
          onUseExample={() => update({ recognitionPlan: f.recognitionPlan.example })}
        >
          <TextArea value={data.recognitionPlan} onCommit={(v) => update({ recognitionPlan: v })} placeholder="e.g., Monthly shoutout at all-hands, manager scorecards include adoption KPI..." rows={4} />
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
