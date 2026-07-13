import { useStageEditor } from '@/state/AppContext'
import type { TestItem, TestStatus } from '@/types'
import { InsightCallout, Label, TextInput } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { useWizardMode } from '@/state/WizardModeContext'
import { AddAnotherButton, AddItemButton, ChipPicker, GuidedLabel, LevelPicker, RemoveItemButton, headline, whyStyle, type LevelOption } from '@/components/guided'
import { coaching } from '@/data/coaching'
import { TEST_TYPES } from '@/data/constants'
import { uid } from '@/lib/id'

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
    update({ items: data.items.map((t) => (t.id === id ? { ...t, ...patch } : t)) })
  const delItem = (id: number) => update({ items: data.items.filter((t) => t.id !== id) })
  const addItem = () =>
    update({ items: [...data.items, { id: uid(), name: '', type: TEST_TYPES[0], owner: '', status: 'Not started', notes: '' }] })

  const hasFailed = data.items.some((t) => t.status === 'Failed')
  const failedNote = hasFailed ? coaching.testing.failed : null

  const steps: WizardStep[] = []

  if (data.items.length === 0) {
    steps.push({
      id: 'start',
      title: 'Add your first test',
      isFilled: false,
      node: (
        <div>
          <h2 style={headline}>{w.name.label}</h2>
          <div style={whyStyle}>{w.name.why}</div>
          <AddItemButton label="Add your first test" onClick={addItem} />
        </div>
      ),
    })
  }

  data.items.forEach((t, i) => {
    const what = t.name.trim() || `Test ${i + 1}`
    const isLast = i === data.items.length - 1

    // Screen 1: name + type
    steps.push({
      id: `${t.id}-name`,
      title: `${what}: what & type`,
      isFilled: !!t.name.trim(),
      summary: t.name ? `${t.name} (${t.type})` : undefined,
      node: (
        <div>
          <h2 style={headline}>{w.name.label}</h2>
          <div style={whyStyle}>{w.name.why}</div>
          <Label>What are you testing?</Label>
          <TextInput value={t.name} onCommit={(v) => setItem(t.id, { name: v })} placeholder="Example: 5 real users try it on their own work" />
          <div style={{ marginTop: '18px' }}>
            <GuidedLabel>What kind of test is it?</GuidedLabel>
            <ChipPicker value={t.type} options={TEST_TYPES} onChange={(v) => setItem(t.id, { type: v })} />
          </div>
          {data.items.length > 1 && <RemoveItemButton label="Remove this test" onClick={() => delItem(t.id)} />}
        </div>
      ),
    })

    // Screen 2: owner
    steps.push({
      id: `${t.id}-owner`,
      title: `${what}: owner`,
      isFilled: !!t.name.trim(),
      summary: t.owner || undefined,
      node: (
        <div>
          <h2 style={headline}>Who runs it?</h2>
          <div style={whyStyle}>{w.owner.why}</div>
          <Label>Owner: who runs it?</Label>
          <TextInput value={t.owner} onCommit={(v) => setItem(t.id, { owner: v })} placeholder="Example: IT - Sam" />
        </div>
      ),
    })

    // Screen 3: status
    steps.push({
      id: `${t.id}-status`,
      title: `${what}: status`,
      isFilled: !!t.name.trim(),
      summary: t.status || undefined,
      node: (
        <div>
          <h2 style={headline}>Where does it stand?</h2>
          <div style={whyStyle}>{w.owner.why}</div>
          <GuidedLabel>Status</GuidedLabel>
          <LevelPicker value={t.status} options={STATUS_LEVELS} onChange={(v) => setItem(t.id, { status: v })} />
        </div>
      ),
    })

    // Screen 3: notes (+ failed note on the last)
    steps.push({
      id: `${t.id}-notes`,
      title: `${what}: notes`,
      isFilled: !!t.notes.trim(),
      summary: t.notes || undefined,
      node: (
        <div>
          <h2 style={headline}>What did you find?</h2>
          <div style={whyStyle}>{w.notes.why}</div>
          <Label>Notes</Label>
          <TextInput value={t.notes} onCommit={(v) => setItem(t.id, { notes: v })} placeholder="What did you find? Any sign-off?" />
          {mode === 'guided' && isLast && failedNote && (
            <InsightCallout tone={failedNote.tone} style={{ marginTop: '16px' }}>{failedNote.text}</InsightCallout>
          )}
          {isLast && <AddAnotherButton label="Add another test" onAdd={addItem} />}
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
