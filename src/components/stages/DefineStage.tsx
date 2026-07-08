import { useStageEditor } from '@/state/AppContext'
import { FieldCoach, TextArea } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { coaching } from '@/data/coaching'
import { getBusinessProfile } from '@/data/business'

export function DefineStage() {
  const { project, data, update } = useStageEditor('define')
  const f = coaching.define.fields
  // Worked examples are tailored to the project's business type.
  const ex = getBusinessProfile(project?.businessType).examples.define

  const steps: WizardStep[] = [
    {
      id: 'statement',
      title: 'What’s changing',
      isFilled: !!data.statement.trim(),
      summary: data.statement,
      emptyLabel: 'Not answered yet',
      node: (
        <FieldCoach
          label={f.statement.label}
          why={f.statement.why}
          example={ex.statement}
          onUseExample={() => update({ statement: ex.statement })}
        >
          <TextArea value={data.statement} onCommit={(v) => update({ statement: v })} placeholder="e.g., We’re switching from X to Y, and people will now do Z." rows={3} />
        </FieldCoach>
      ),
    },
    {
      id: 'successLooks',
      title: 'What success looks like',
      isFilled: !!data.successLooks.trim(),
      summary: data.successLooks,
      emptyLabel: 'Not answered yet',
      node: (
        <FieldCoach
          label={f.successLooks.label}
          why={f.successLooks.why}
          example={ex.successLooks}
          onUseExample={() => update({ successLooks: ex.successLooks })}
        >
          <TextArea value={data.successLooks} onCommit={(v) => update({ successLooks: v })} placeholder="In 90 days, we’ll know this worked when..." rows={3} />
        </FieldCoach>
      ),
    },
    {
      id: 'whyNow',
      title: 'Why now',
      isFilled: !!data.whyNow.trim(),
      summary: data.whyNow,
      emptyLabel: 'Not answered yet',
      node: (
        <FieldCoach
          label={f.whyNow.label}
          why={f.whyNow.why}
          example={ex.whyNow}
          onUseExample={() => update({ whyNow: ex.whyNow })}
        >
          <TextArea value={data.whyNow} onCommit={(v) => update({ whyNow: v })} placeholder="The business reason, and what happens if you don’t change..." rows={3} />
        </FieldCoach>
      ),
    },
  ]

  return <StageFlow stageId="define" icon={coaching.define.icon} blurb={coaching.define.intro} steps={steps} guided={false} guidance={false} />
}
