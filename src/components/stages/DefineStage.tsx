import { useStageEditor } from '@/state/AppContext'
import { FieldCoach, StageIntro, TextArea, TextInput } from '@/components/ui'
import { TipBox } from '@/components/TipBox'
import { coaching } from '@/data/coaching'

export function DefineStage() {
  const { data, update } = useStageEditor('define')
  return (
    <>
      <StageIntro icon={coaching.define.icon}>{coaching.define.intro}</StageIntro>
      <TipBox stageId="define" />

      <FieldCoach
        label={coaching.define.fields.statement.label}
        why={coaching.define.fields.statement.why}
        example={coaching.define.fields.statement.example}
        onUseExample={() => update({ statement: coaching.define.fields.statement.example })}
      >
        <TextArea value={data.statement} onCommit={(v) => update({ statement: v })} placeholder="e.g., We’re switching from X to Y, and people will now do Z." rows={3} />
      </FieldCoach>

      <FieldCoach
        label={coaching.define.fields.scope.label}
        why={coaching.define.fields.scope.why}
        example={coaching.define.fields.scope.example}
        onUseExample={() => update({ scope: coaching.define.fields.scope.example })}
      >
        <TextInput value={data.scope} onCommit={(v) => update({ scope: v })} placeholder="e.g., All North America operations, ~320 employees" />
      </FieldCoach>

      <FieldCoach
        label={coaching.define.fields.successLooks.label}
        why={coaching.define.fields.successLooks.why}
        example={coaching.define.fields.successLooks.example}
        onUseExample={() => update({ successLooks: coaching.define.fields.successLooks.example })}
      >
        <TextArea value={data.successLooks} onCommit={(v) => update({ successLooks: v })} placeholder="In 90 days, we’ll know this worked when..." rows={3} />
      </FieldCoach>

      <FieldCoach
        label={coaching.define.fields.whyNow.label}
        why={coaching.define.fields.whyNow.why}
        example={coaching.define.fields.whyNow.example}
        onUseExample={() => update({ whyNow: coaching.define.fields.whyNow.example })}
      >
        <TextArea value={data.whyNow} onCommit={(v) => update({ whyNow: v })} placeholder="The business reason, and what happens if you don’t change..." rows={3} />
      </FieldCoach>
    </>
  )
}
