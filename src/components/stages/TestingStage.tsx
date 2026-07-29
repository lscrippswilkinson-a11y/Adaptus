import { useStageEditor } from '@/state/AppContext'
import type { TestItem, TestStatus } from '@/types'
import { InsightCallout, Label, TextInput } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { useWizardMode } from '@/state/WizardModeContext'
import { AddAnotherButton, AddItemButton, ChipPicker, GuidedLabel, LevelPicker, RemoveItemButton, headline, whyStyle, type LevelOption } from '@/components/guided'
import { coaching } from '@/data/coaching'
import { TEST_TYPES } from '@/data/constants'
import { uid } from '@/lib/id'
import { t, tp } from '@/i18n'

const STATUS_LEVELS: LevelOption<TestStatus>[] = [
  { value: 'Not started', label: 'Not started', desc: 'Haven’t run it yet.' },
  { value: 'In progress', label: 'In progress', desc: 'Currently being tested.' },
  { value: 'Passed', label: 'Passed', desc: 'Ran it and it works, signed off.' },
  { value: 'Failed', label: 'Failed', desc: 'Ran it and found a problem. Fix the cause and re-test.' },
]

export function TestingStage() {
  const { data, update } = useStageEditor('testing')
  const { mode } = useWizardMode()
  const w = coaching.testing.wizard

  const setItem = (id: number, patch: Partial<TestItem>) =>
    update({ items: data.items.map((row) => (row.id === id ? { ...row, ...patch } : row)) })
  const delItem = (id: number) => update({ items: data.items.filter((row) => row.id !== id) })
  const addItem = () =>
    update({ items: [...data.items, { id: uid(), name: '', type: TEST_TYPES[0], owner: '', status: 'Not started', notes: '' }] })

  const hasFailed = data.items.some((row) => row.status === 'Failed')
  const failedNote = hasFailed ? coaching.testing.failed : null

  const steps: WizardStep[] = []

  if (data.items.length === 0) {
    steps.push({
      id: 'start',
      title: t('Add your first test'),
      isFilled: false,
      node: (
        <div>
          <h2 style={headline}>{w.name.label}</h2>
          <div style={whyStyle}>{w.name.why}</div>
          <AddItemButton label={t('Add your first test')} onClick={addItem} />
        </div>
      ),
    })
  }

  data.items.forEach((row, i) => {
    const what = row.name.trim() || tp('Test {n}', { n: i + 1 })
    const isLast = i === data.items.length - 1

    // Screen 1: name + type
    steps.push({
      id: `${row.id}-name`,
      title: tp('{test}: what & type', { test: what }),
      isFilled: !!row.name.trim(),
      summary: row.name ? `${row.name} (${t(row.type)})` : undefined,
      node: (
        <div>
          <h2 style={headline}>{w.name.label}</h2>
          <div style={whyStyle}>{w.name.why}</div>
          <Label>{t('What are you testing?')}</Label>
          <TextInput value={row.name} onCommit={(v) => setItem(row.id, { name: v })} placeholder={t('Example: 5 real users try it on their own work')} />
          <div style={{ marginTop: '18px' }}>
            <GuidedLabel>{t('What kind of test is it?')}</GuidedLabel>
            <ChipPicker value={row.type} options={TEST_TYPES} onChange={(v) => setItem(row.id, { type: v })} />
          </div>
          {data.items.length > 1 && <RemoveItemButton label={t('Remove this test')} onClick={() => delItem(row.id)} />}
        </div>
      ),
    })

    // Screen 2: owner
    steps.push({
      id: `${row.id}-owner`,
      title: tp('{test}: owner', { test: what }),
      isFilled: !!row.name.trim(),
      summary: row.owner || undefined,
      node: (
        <div>
          <h2 style={headline}>{t('Who runs it?')}</h2>
          <div style={whyStyle}>{w.owner.why}</div>
          <Label>{t('Owner: who runs it?')}</Label>
          <TextInput value={row.owner} onCommit={(v) => setItem(row.id, { owner: v })} placeholder={t('Example: IT - Sam')} />
        </div>
      ),
    })

    // Screen 3: status
    steps.push({
      id: `${row.id}-status`,
      title: tp('{test}: status', { test: what }),
      isFilled: !!row.name.trim(),
      summary: row.status ? t(row.status) : undefined,
      node: (
        <div>
          <h2 style={headline}>{t('Where does it stand?')}</h2>
          <div style={whyStyle}>{w.owner.why}</div>
          <GuidedLabel>{t('Status')}</GuidedLabel>
          <LevelPicker value={row.status} options={STATUS_LEVELS} onChange={(v) => setItem(row.id, { status: v })} />
        </div>
      ),
    })

    // Screen 3: notes (+ failed note on the last)
    steps.push({
      id: `${row.id}-notes`,
      title: tp('{test}: notes', { test: what }),
      isFilled: !!row.notes.trim(),
      summary: row.notes || undefined,
      node: (
        <div>
          <h2 style={headline}>{t('What did you find?')}</h2>
          <div style={whyStyle}>{w.notes.why}</div>
          <Label>{t('Notes')}</Label>
          <TextInput value={row.notes} onCommit={(v) => setItem(row.id, { notes: v })} placeholder={t('What did you find? Any sign-off?')} />
          {mode === 'guided' && isLast && failedNote && (
            <InsightCallout tone={failedNote.tone} style={{ marginTop: '16px' }}>{failedNote.text}</InsightCallout>
          )}
          {isLast && <AddAnotherButton label={t('Add another test')} onAdd={addItem} />}
        </div>
      ),
    })
  })

  return (
    <StageFlow
      stageId="testing"
      icon={coaching.testing.icon}
      blurb={coaching.testing.intro}
      extra={failedNote ? <InsightCallout tone={failedNote.tone} style={{ marginBottom: '14px' }}>{failedNote.text}</InsightCallout> : undefined}
      steps={steps}
    />
  )
}
