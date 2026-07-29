import { useStageEditor } from '@/state/AppContext'
import type { ResistanceItem, Severity } from '@/types'
import { asExample, FieldCoach, InsightCallout, Label, TextArea, TextInput } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { useWizardMode } from '@/state/WizardModeContext'
import { AddAnotherButton, AddItemButton, ChipPicker, GuidedLabel, LevelPicker, RemoveItemButton, headline, whyStyle, type LevelOption } from '@/components/guided'
import { RESISTANCE_TYPES } from '@/data/constants'
import { coaching } from '@/data/coaching'
import { uid } from '@/lib/id'
import { t, tp } from '@/i18n'

const SEVERITY_LEVELS: LevelOption<Severity>[] = [
  { value: 'High', label: 'High', desc: 'Could stall or sink the rollout if ignored, needs a real, specific response.' },
  { value: 'Medium', label: 'Medium', desc: 'A genuine drag on momentum, but manageable with attention.' },
  { value: 'Low', label: 'Low', desc: 'Minor grumbling, worth noting, but not a threat on its own.' },
]

export function ResistanceStage() {
  const { data, update } = useStageEditor('resistance')
  const { mode } = useWizardMode()
  const w = coaching.resistance.wizard

  const setItem = (id: number, patch: Partial<ResistanceItem>) =>
    update({ items: data.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) })
  const delItem = (id: number) => update({ items: data.items.filter((it) => it.id !== id) })
  const addItem = () => update({ items: [...data.items, { id: uid(), type: 'Fear of job loss', group: '', severity: 'Medium', intervention: '' }] })

  const hasHighSeverity = data.items.some((it) => it.severity === 'High')
  const highSeverityNote = hasHighSeverity ? coaching.resistance.highSeverity : null

  const steps: WizardStep[] = []

  if (data.items.length === 0) {
    steps.push({
      id: 'start',
      title: t('Add your first source'),
      isFilled: false,
      node: (
        <div>
          <h2 style={headline}>{w.source.label}</h2>
          <div style={whyStyle}>{w.source.why}</div>
          <AddItemButton label={t('Add your first source of pushback')} onClick={addItem} />
        </div>
      ),
    })
  }

  data.items.forEach((item, i) => {
    const who = item.group.trim() || t(item.type)
    const isLast = i === data.items.length - 1

    // Screen 1: type + affected group
    steps.push({
      id: `${item.id}-source`,
      title: tp('{source}: source', { source: who }),
      isFilled: !!item.group.trim(),
      summary: item.group ? `${t(item.type)}, ${item.group}` : t(item.type),
      node: (
        <div>
          <h2 style={headline}>{w.source.label}</h2>
          <div style={whyStyle}>{w.source.why}</div>
          <GuidedLabel>{t('What’s the likely reason?')}</GuidedLabel>
          <ChipPicker value={item.type} options={RESISTANCE_TYPES} onChange={(v) => setItem(item.id, { type: v })} />
          <div style={{ marginTop: '18px' }}>
            <Label>{t('Which group is this coming from?')}</Label>
            <TextInput value={item.group} onCommit={(v) => setItem(item.id, { group: v })} placeholder={t('Example: Sales Team, Middle Managers')} />
          </div>
          {data.items.length > 1 && <RemoveItemButton label={t('Remove this item')} onClick={() => delItem(item.id)} />}
        </div>
      ),
    })

    // Screen 2: severity
    steps.push({
      id: `${item.id}-severity`,
      title: tp('{source}: severity', { source: who }),
      isFilled: !!item.group.trim(),
      summary: tp('{level} severity', { level: t(item.severity) }),
      node: (
        <div>
          <h2 style={headline}>{t('How serious is this pushback?')}</h2>
          <div style={whyStyle}>{w.severity.why}</div>
          <LevelPicker value={item.severity} options={SEVERITY_LEVELS} onChange={(v) => setItem(item.id, { severity: v })} />
        </div>
      ),
    })

    // Screen 3: intervention (+ high-severity note on the last)
    steps.push({
      id: `${item.id}-intervention`,
      title: tp('{source}: your response', { source: who }),
      isFilled: !!item.intervention.trim(),
      summary: item.intervention || undefined,
      node: (
        <div>
          <h2 style={headline}>{t('How will you address it?')}</h2>
          <div style={whyStyle}>{w.intervention.why}</div>
          <Label>{t('Your response: who does what, by when?')}</Label>
          <TextInput value={item.intervention} onCommit={(v) => setItem(item.id, { intervention: v })} placeholder={t('Example: Town hall + demo, then one-on-one coaching...')} />
          {mode === 'guided' && isLast && highSeverityNote && (
            <InsightCallout tone={highSeverityNote.tone} style={{ marginTop: '16px' }}>{highSeverityNote.text}</InsightCallout>
          )}
          {isLast && <AddAnotherButton label={t('Add another source of pushback')} onAdd={addItem} />}
        </div>
      ),
    })
  })

  // Final step: the general (ongoing) resistance plan, independent of the items.
  steps.push({
    id: 'generalPlan',
    title: t('Ongoing plan'),
    isFilled: !!data.generalPlan.trim(),
    summary: data.generalPlan || undefined,
    node: (
      <FieldCoach label={coaching.resistance.fields.generalPlan.label} why={coaching.resistance.fields.generalPlan.why}>
        <TextArea value={data.generalPlan} onCommit={(v) => update({ generalPlan: v })} placeholder={asExample(coaching.resistance.fields.generalPlan.example)} rows={4} />
      </FieldCoach>
    ),
  })

  return (
    <StageFlow
      stageId="resistance"
      icon={coaching.resistance.icon}
      blurb={coaching.resistance.intro}
      extra={highSeverityNote ? <InsightCallout tone={highSeverityNote.tone} style={{ marginBottom: '14px' }}>{highSeverityNote.text}</InsightCallout> : undefined}
      steps={steps}
    />
  )
}
