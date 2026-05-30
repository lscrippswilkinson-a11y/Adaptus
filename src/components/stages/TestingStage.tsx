import { useStageEditor } from '@/state/AppContext'
import type { TestItem, TestStatus } from '@/types'
import { AddButton, DelButton, InsightCallout, TextInput } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { coaching } from '@/data/coaching'
import { TEST_TYPES, TEST_STATUSES } from '@/data/constants'
import { uid } from '@/lib/id'

const STATUS_BG: Record<TestStatus, string> = {
  'Not started': 'rgba(var(--fg),0.05)',
  'In progress': 'rgba(245,158,11,0.15)',
  Passed: 'rgba(34,197,94,0.15)',
  Failed: 'rgba(239,68,68,0.15)',
}

export function TestingStage() {
  const { data, update } = useStageEditor('testing')

  const setItem = (id: number, patch: Partial<TestItem>) =>
    update({ items: data.items.map((t) => (t.id === id ? { ...t, ...patch } : t)) })
  const delItem = (id: number) => update({ items: data.items.filter((t) => t.id !== id) })
  const addItem = () =>
    update({ items: [...data.items, { id: uid(), name: '', type: TEST_TYPES[0], owner: '', status: 'Not started', notes: '' }] })

  const hasFailed = data.items.some((t) => t.status === 'Failed')

  const steps: WizardStep[] = [{
    id: 'testing',
    title: 'Plan validation',
    isFilled: data.items.length > 0,
    summary: data.items.length ? `${data.items.length} test${data.items.length === 1 ? '' : 's'} planned` : undefined,
    node: (
    <div>
      {hasFailed && (
        <InsightCallout tone={coaching.testing.failed.tone} style={{ marginBottom: '14px' }}>
          {coaching.testing.failed.text}
        </InsightCallout>
      )}

      {data.items.map((t) => (
        <div className="cq-card" key={t.id}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
            <TextInput value={t.name} onCommit={(v) => setItem(t.id, { name: v })} placeholder="What are you testing? (e.g., UAT with 5 pilot users)" style={{ flex: 1, minWidth: 0 }} />
            <DelButton onClick={() => delItem(t.id)} />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <div style={{ flex: 1 }}>
              <div className="cq-lbl">Type</div>
              <select className="cq-select" value={t.type} onChange={(e) => setItem(t.id, { type: e.target.value })}>
                {TEST_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <div className="cq-lbl">Owner</div>
              <TextInput value={t.owner} onCommit={(v) => setItem(t.id, { owner: v })} placeholder="Who runs it?" />
            </div>
            <div style={{ width: '150px', flexShrink: 0 }}>
              <div className="cq-lbl">Status</div>
              <select className="cq-select" value={t.status} style={{ background: STATUS_BG[t.status] }} onChange={(e) => setItem(t.id, { status: e.target.value as TestStatus })}>
                {TEST_STATUSES.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div>
            <div className="cq-lbl">Notes</div>
            <TextInput value={t.notes} onCommit={(v) => setItem(t.id, { notes: v })} placeholder="What did you find? Any sign-off?" />
          </div>
        </div>
      ))}
      <AddButton label="+ Add Test" onClick={addItem} />
    </div>
    ),
  }]

  return <StageFlow stageId="testing" icon={coaching.testing.icon} blurb={coaching.testing.intro} steps={steps} />
}
