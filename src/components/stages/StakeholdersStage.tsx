import { useStageEditor } from '@/state/AppContext'
import type { Influence, StakeholderRow, Support } from '@/types'
import { InsightCallout, Label, TextInput } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { useWizardMode } from '@/state/WizardModeContext'
import { AddAnotherButton, AddItemButton, LevelPicker, RemoveItemButton, headline, whyStyle, type LevelOption } from '@/components/guided'
import { coaching } from '@/data/coaching'
import { uid } from '@/lib/id'
import { t, tp } from '@/i18n'

const INFLUENCE_LEVELS: LevelOption<Influence>[] = [
  { value: 'High', label: 'High influence', desc: 'Can approve, block, or mobilize others; when they speak, people listen.' },
  { value: 'Medium', label: 'Medium influence', desc: 'Sways their own peers and team, but not the whole organization.' },
  { value: 'Low', label: 'Low influence', desc: 'Limited reach, mainly speaks for themselves.' },
]

const SUPPORT_LEVELS: LevelOption<Support>[] = [
  { value: 'Advocate', label: 'Advocate', desc: 'Actively championing the change, already on board and vocal about it.' },
  { value: 'Neutral', label: 'Neutral', desc: 'Waiting to see, not opposed, but not yet convinced either.' },
  { value: 'Resistant', label: 'Resistant', desc: 'Pushing back, has real doubts, or is actively against it.' },
  { value: 'Unknown', label: 'Not sure yet', desc: 'You genuinely don’t know where they stand. Worth finding out.' },
]

export function StakeholdersStage() {
  const { data, update } = useStageEditor('stakeholders')
  const { mode } = useWizardMode()
  const w = coaching.stakeholders.wizard

  const setRow = (id: number, patch: Partial<StakeholderRow>) =>
    update({ rows: data.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) })
  const delRow = (id: number) => update({ rows: data.rows.filter((r) => r.id !== id) })
  const addRow = () => update({ rows: [...data.rows, { id: uid(), name: '', role: '', influence: 'Medium', support: 'Neutral', action: '' }] })

  const coalition = coaching.stakeholders.summary(data.rows)

  const steps: WizardStep[] = []

  if (data.rows.length === 0) {
    steps.push({
      id: 'start',
      title: t('Add your first key person'),
      isFilled: false,
      node: (
        <div>
          <h2 style={headline}>{w.name.label}</h2>
          <div style={whyStyle}>{w.name.why}</div>
          <AddItemButton label={t('Add your first key person')} onClick={addRow} />
        </div>
      ),
    })
  }

  data.rows.forEach((r, i) => {
    const who = r.name.trim() || tp('Person {n}', { n: i + 1 })
    const isLast = i === data.rows.length - 1
    const influenceLabel = INFLUENCE_LEVELS.find((o) => o.value === r.influence)?.label ?? r.influence
    const supportLabel = SUPPORT_LEVELS.find((o) => o.value === r.support)?.label ?? r.support
    const insight = coaching.stakeholders.rowInsight(r)

    // Screen 1: name & role
    steps.push({
      id: `${r.id}-name`,
      title: tp('{person}: name & role', { person: who }),
      isFilled: !!r.name.trim(),
      summary: r.name ? (r.role ? `${r.name}, ${r.role}` : r.name) : undefined,
      node: (
        <div>
          <h2 style={headline}>{w.name.label}</h2>
          <div style={whyStyle}>{w.name.why}</div>
          <Label>{t('Full name')}</Label>
          <TextInput value={r.name} onCommit={(v) => setRow(r.id, { name: v })} placeholder={t('Example: Elena Torres')} />
          <div style={{ marginTop: '14px' }}>
            <Label>{t('Title / role (optional)')}</Label>
            <TextInput value={r.role} onCommit={(v) => setRow(r.id, { role: v })} placeholder={t('Example: Managing Partner')} />
          </div>
          {data.rows.length > 1 && <RemoveItemButton label={t('Remove this person')} onClick={() => delRow(r.id)} />}
        </div>
      ),
    })

    // Screen 2: influence
    steps.push({
      id: `${r.id}-influence`,
      title: tp('{person}: influence', { person: who }),
      isFilled: !!r.name.trim(),
      summary: t(influenceLabel),
      node: (
        <div>
          <h2 style={headline}>{tp('How much sway does {person} have?', { person: r.name.trim() || t('this person') })}</h2>
          <div style={whyStyle}>{w.influence.why}</div>
          <LevelPicker value={r.influence} options={INFLUENCE_LEVELS} onChange={(v) => setRow(r.id, { influence: v })} />
        </div>
      ),
    })

    // Screen 3: current support
    steps.push({
      id: `${r.id}-support`,
      title: tp('{person}: support', { person: who }),
      isFilled: !!r.name.trim(),
      summary: t(supportLabel),
      node: (
        <div>
          <h2 style={headline}>{tp('Where does {person} stand on the change today?', { person: r.name.trim() || t('this person') })}</h2>
          <div style={whyStyle}>{w.support.why}</div>
          <LevelPicker value={r.support} options={SUPPORT_LEVELS} onChange={(v) => setRow(r.id, { support: v })} />
        </div>
      ),
    })

    // Screen 4: engagement action (+ live insight, coalition tally on the last)
    steps.push({
      id: `${r.id}-action`,
      title: tp('{person}: your next move', { person: who }),
      isFilled: !!r.action.trim(),
      summary: r.action || undefined,
      node: (
        <div>
          <h2 style={headline}>{tp('What will you do to move {person} toward Advocate?', { person: r.name.trim() || t('them') })}</h2>
          <div style={whyStyle}>{w.action.why}</div>
          <Label>{t('What you’ll do')}</Label>
          <TextInput value={r.action} onCommit={(v) => setRow(r.id, { action: v })} placeholder={t('Example: a quick one-to-one before the big meeting...')} />
          {insight && <InsightCallout tone={insight.tone} style={{ marginTop: '16px' }}>{insight.text}</InsightCallout>}
          {mode === 'guided' && isLast && coalition && <InsightCallout tone={coalition.tone} style={{ marginTop: '12px' }}>{coalition.text}</InsightCallout>}
          {isLast && <AddAnotherButton label={t('Add another person')} onAdd={addRow} />}
        </div>
      ),
    })
  })

  return <StageFlow stageId="stakeholders" icon={coaching.stakeholders.icon} blurb={coaching.stakeholders.intro} extra={coalition ? <InsightCallout tone={coalition.tone} style={{ marginBottom: '14px' }}>{coalition.text}</InsightCallout> : undefined} steps={steps} />
}
