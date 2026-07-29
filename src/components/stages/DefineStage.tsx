import { useStageEditor } from '@/state/AppContext'
import { asExample, FieldCoach, TextArea } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { coaching } from '@/data/coaching'
import { getBusinessProfile } from '@/data/business'
import { useT } from '@/i18n/LanguageContext'

export function DefineStage() {
  const t = useT()
  const { project, data, update } = useStageEditor('define')
  const f = coaching.define.fields
  // Worked examples are tailored to the project's business type.
  const ex = getBusinessProfile(project?.businessType).examples.define

  const steps: WizardStep[] = [
    {
      id: 'statement',
      title: t('What’s changing'),
      isFilled: !!data.statement.trim(),
      summary: data.statement,
      emptyLabel: t('Not answered yet'),
      node: (
        <FieldCoach label={f.statement.label} why={f.statement.why}>
          <TextArea value={data.statement} onCommit={(v) => update({ statement: v })} placeholder={asExample(t(ex.statement))} rows={3} />
        </FieldCoach>
      ),
    },
    {
      id: 'successLooks',
      title: t('What success looks like'),
      isFilled: !!data.successLooks.trim(),
      summary: data.successLooks,
      emptyLabel: t('Not answered yet'),
      node: (
        <FieldCoach label={f.successLooks.label} why={f.successLooks.why}>
          <TextArea value={data.successLooks} onCommit={(v) => update({ successLooks: v })} placeholder={asExample(t(ex.successLooks))} rows={3} />
        </FieldCoach>
      ),
    },
    {
      id: 'whyNow',
      title: t('Why now'),
      isFilled: !!data.whyNow.trim(),
      summary: data.whyNow,
      emptyLabel: t('Not answered yet'),
      node: (
        <FieldCoach label={f.whyNow.label} why={f.whyNow.why}>
          <TextArea value={data.whyNow} onCommit={(v) => update({ whyNow: v })} placeholder={asExample(t(ex.whyNow))} rows={3} />
        </FieldCoach>
      ),
    },
  ]

  return <StageFlow stageId="define" icon={coaching.define.icon} blurb={coaching.define.intro} steps={steps} guided={false} guidance={false} />
}
