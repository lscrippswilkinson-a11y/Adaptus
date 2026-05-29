import { useStageEditor } from '@/state/AppContext'
import { FieldCoach, InsightCallout, StageIntro, TextArea, TextInput } from '@/components/ui'
import { TipBox } from '@/components/TipBox'
import { coaching } from '@/data/coaching'

export function SustainmentStage() {
  const { data, update } = useStageEditor('sustainment')
  return (
    <>
      <StageIntro icon={coaching.sustainment.icon}>{coaching.sustainment.intro}</StageIntro>
      <TipBox stageId="sustainment" />

      <InsightCallout tone={coaching.sustainment.topNote.tone} style={{ marginBottom: '12px' }}>
        {coaching.sustainment.topNote.text}
      </InsightCallout>

      <FieldCoach
        label={coaching.sustainment.fields.reinforcementOwner.label}
        why={coaching.sustainment.fields.reinforcementOwner.why}
        example={coaching.sustainment.fields.reinforcementOwner.example}
        onUseExample={() => update({ reinforcementOwner: coaching.sustainment.fields.reinforcementOwner.example })}
      >
        <TextInput value={data.reinforcementOwner} onCommit={(v) => update({ reinforcementOwner: v })} placeholder="e.g., Operations Manager, HR Business Partner" />
      </FieldCoach>

      <FieldCoach
        label={coaching.sustainment.fields.checkpointDates.label}
        why={coaching.sustainment.fields.checkpointDates.why}
        example={coaching.sustainment.fields.checkpointDates.example}
        onUseExample={() => update({ checkpointDates: coaching.sustainment.fields.checkpointDates.example })}
      >
        <TextArea value={data.checkpointDates} onCommit={(v) => update({ checkpointDates: v })} placeholder="e.g., 30-day: Oct 15 · 60-day: Nov 15 · 90-day: Dec 15" rows={3} />
      </FieldCoach>

      <FieldCoach
        label={coaching.sustainment.fields.metrics.label}
        why={coaching.sustainment.fields.metrics.why}
        example={coaching.sustainment.fields.metrics.example}
        onUseExample={() => update({ metrics: coaching.sustainment.fields.metrics.example })}
      >
        <TextArea value={data.metrics} onCommit={(v) => update({ metrics: v })} placeholder="e.g., Monthly login rate stays above 85%, no return to manual reporting..." rows={3} />
      </FieldCoach>

      <FieldCoach
        label={coaching.sustainment.fields.risks.label}
        why={coaching.sustainment.fields.risks.why}
        example={coaching.sustainment.fields.risks.example}
        onUseExample={() => update({ risks: coaching.sustainment.fields.risks.example })}
      >
        <TextArea value={data.risks} onCommit={(v) => update({ risks: v })} placeholder="e.g., New untrained manager, peak season pressure, competing priority rollouts..." rows={3} />
      </FieldCoach>

      <FieldCoach
        label={coaching.sustainment.fields.recognitionPlan.label}
        why={coaching.sustainment.fields.recognitionPlan.why}
        example={coaching.sustainment.fields.recognitionPlan.example}
        onUseExample={() => update({ recognitionPlan: coaching.sustainment.fields.recognitionPlan.example })}
      >
        <TextArea value={data.recognitionPlan} onCommit={(v) => update({ recognitionPlan: v })} placeholder="e.g., Monthly shoutout at all-hands, manager scorecards include adoption KPI..." rows={4} />
      </FieldCoach>
    </>
  )
}
