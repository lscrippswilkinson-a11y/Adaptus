import { useStageEditor } from '@/state/AppContext'
import { FieldCoach, TextArea, TextInput } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { coaching } from '@/data/coaching'

export function DefineStage() {
  const { data, update } = useStageEditor('define')
  const f = coaching.define.fields

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
          example={f.statement.example}
          onUseExample={() => update({ statement: f.statement.example })}
        >
          <TextArea value={data.statement} onCommit={(v) => update({ statement: v })} placeholder="e.g., We’re switching from X to Y, and people will now do Z." rows={3} />
        </FieldCoach>
      ),
    },
    {
      id: 'scope',
      title: 'Who it affects',
      isFilled: !!data.scope.trim(),
      summary: data.scope,
      emptyLabel: 'Not answered yet',
      node: (
        <FieldCoach
          label={f.scope.label}
          why={f.scope.why}
          example={f.scope.example}
          onUseExample={() => update({ scope: f.scope.example })}
        >
          <TextInput value={data.scope} onCommit={(v) => update({ scope: v })} placeholder="e.g., All North America operations — field, support, and dispatch teams" />
        </FieldCoach>
      ),
    },
    {
      id: 'headcount',
      title: 'How many people',
      isFilled: !!data.headcount.trim(),
      summary: data.headcount,
      emptyLabel: 'Not answered yet',
      node: (
        <FieldCoach
          label={f.headcount.label}
          why={f.headcount.why}
          example={f.headcount.example}
          onUseExample={() => update({ headcount: f.headcount.example })}
        >
          <TextInput value={data.headcount} onCommit={(v) => update({ headcount: v })} placeholder="e.g., ~320 people" />
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
          example={f.successLooks.example}
          onUseExample={() => update({ successLooks: f.successLooks.example })}
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
          example={f.whyNow.example}
          onUseExample={() => update({ whyNow: f.whyNow.example })}
        >
          <TextArea value={data.whyNow} onCommit={(v) => update({ whyNow: v })} placeholder="The business reason, and what happens if you don’t change..." rows={3} />
        </FieldCoach>
      ),
    },
  ]

  return <StageFlow stageId="define" icon={coaching.define.icon} blurb={coaching.define.intro} steps={steps} guided={false} guidance={false} />
}
