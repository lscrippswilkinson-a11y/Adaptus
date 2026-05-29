import { useStageEditor } from '@/state/AppContext'
import type { Dependency, DependencyStatus, DependencyType } from '@/types'
import { AddButton, DelButton, InsightCallout, StageIntro, TextInput } from '@/components/ui'
import { TipBox } from '@/components/TipBox'
import { coaching } from '@/data/coaching'
import { DEPENDENCY_TYPES, DEPENDENCY_STATUSES } from '@/data/constants'
import { uid } from '@/lib/id'

const STATUS_BG: Record<DependencyStatus, string> = {
  'Not started': 'rgba(255,255,255,0.05)',
  'In progress': 'rgba(245,158,11,0.15)',
  Ready: 'rgba(34,197,94,0.15)',
  'At risk': 'rgba(239,68,68,0.15)',
}

export function DependenciesStage() {
  const { data, update } = useStageEditor('dependencies')

  const setItem = (id: number, patch: Partial<Dependency>) =>
    update({ items: data.items.map((d) => (d.id === id ? { ...d, ...patch } : d)) })
  const delItem = (id: number) => update({ items: data.items.filter((d) => d.id !== id) })
  const addItem = () =>
    update({ items: [...data.items, { id: uid(), name: '', type: 'Team', owner: '', neededBy: '', status: 'Not started' }] })

  const hasAtRisk = data.items.some((d) => d.status === 'At risk')

  return (
    <div>
      <StageIntro icon={coaching.dependencies.icon}>{coaching.dependencies.intro}</StageIntro>
      <TipBox stageId="dependencies" />

      {hasAtRisk && (
        <InsightCallout tone={coaching.dependencies.atRisk.tone} style={{ marginBottom: '14px' }}>
          {coaching.dependencies.atRisk.text}
        </InsightCallout>
      )}

      {data.items.map((d) => (
        <div className="cq-card" key={d.id}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
            <TextInput value={d.name} onCommit={(v) => setItem(d.id, { name: v })} placeholder="What you depend on (e.g., IT account provisioning)" style={{ flex: 1, minWidth: 0 }} />
            <DelButton onClick={() => delItem(d.id)} />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <div style={{ width: '130px', flexShrink: 0 }}>
              <div className="cq-lbl">Type</div>
              <select className="cq-select" value={d.type} onChange={(e) => setItem(d.id, { type: e.target.value as DependencyType })}>
                {DEPENDENCY_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <div className="cq-lbl">Owner</div>
              <TextInput value={d.owner} onCommit={(v) => setItem(d.id, { owner: v })} placeholder="Who's responsible?" />
            </div>
            <div style={{ width: '150px', flexShrink: 0 }}>
              <div className="cq-lbl">Needed by</div>
              <input type="date" className="cq-input" value={d.neededBy} onChange={(e) => setItem(d.id, { neededBy: e.target.value })} />
            </div>
          </div>
          <div>
            <div className="cq-lbl">Status</div>
            <select className="cq-select" value={d.status} style={{ background: STATUS_BG[d.status], maxWidth: '220px' }} onChange={(e) => setItem(d.id, { status: e.target.value as DependencyStatus })}>
              {DEPENDENCY_STATUSES.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      ))}
      <AddButton label="+ Add Dependency" onClick={addItem} />
    </div>
  )
}
