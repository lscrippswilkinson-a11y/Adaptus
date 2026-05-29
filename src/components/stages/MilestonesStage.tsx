import { useState } from 'react'
import { useStageEditor } from '@/state/AppContext'
import type { MilestoneOwner } from '@/types'
import { AddButton, Card, DelButton, InsightCallout, Label, StageIntro, TextInput } from '@/components/ui'
import { TipBox } from '@/components/TipBox'
import { LAUNCH_ITEMS, LAUNCH_EXPLAINERS } from '@/data/constants'
import { coaching } from '@/data/coaching'
import { uid } from '@/lib/id'

function LaunchRow({ item, checked, onToggle }: { item: string; checked: boolean; onToggle: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="launch-item">
      <div className="launch-row" onClick={onToggle}>
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '5px',
            border: '1.5px solid',
            background: checked ? '#22c55e' : 'transparent',
            borderColor: checked ? '#22c55e' : 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '12px',
            flexShrink: 0,
          }}
        >
          {checked ? '✓' : ''}
        </div>
        <div style={{ fontSize: '14px', color: checked ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.8)', textDecoration: checked ? 'line-through' : 'none', flex: 1 }}>
          {item}
        </div>
        <button
          type="button"
          className={'info-btn' + (open ? ' open' : '')}
          onClick={(e) => {
            e.stopPropagation()
            setOpen((o) => !o)
          }}
        >
          {open ? '✕' : '?'}
        </button>
      </div>
      <div className={'launch-explainer' + (open ? ' open' : '')}>{LAUNCH_EXPLAINERS[item] || ''}</div>
    </div>
  )
}

export function MilestonesStage() {
  const { data, update } = useStageEditor('milestones')

  const setOwner = (id: number, patch: Partial<MilestoneOwner>) =>
    update({ owners: data.owners.map((o) => (o.id === id ? { ...o, ...patch } : o)) })
  const delOwner = (id: number) => update({ owners: data.owners.filter((o) => o.id !== id) })
  const addOwner = () => update({ owners: [...data.owners, { id: uid(), name: '', workstream: '', email: '' }] })

  const checked = new Set(data.launchChecklist)
  const toggleItem = (item: string) => {
    const next = new Set(checked)
    if (next.has(item)) next.delete(item)
    else next.add(item)
    update({ launchChecklist: [...next] })
  }

  const readyCount = data.launchChecklist.length
  const readinessInsight = coaching.milestones.readinessInsight(readyCount, LAUNCH_ITEMS.length)

  return (
    <div>
      <StageIntro icon={coaching.milestones.icon}>{coaching.milestones.intro}</StageIntro>
      <TipBox stageId="milestones" />
      <Card>
        <Label>Go-live date</Label>
        <input
          type="date"
          className="cq-input"
          style={{ maxWidth: '220px' }}
          value={data.goLiveDate}
          onChange={(e) => update({ goLiveDate: e.target.value })}
        />
      </Card>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '10px' }}>Workstream owners</div>
        {data.owners.map((o) => (
          <div className="cq-card" key={o.id}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <TextInput value={o.name} onCommit={(v) => setOwner(o.id, { name: v })} placeholder="Name" style={{ flex: 1 }} />
              <TextInput value={o.workstream} onCommit={(v) => setOwner(o.id, { workstream: v })} placeholder="Workstream" style={{ flex: 1 }} />
              <TextInput value={o.email} onCommit={(v) => setOwner(o.id, { email: v })} placeholder="Email" style={{ flex: 1 }} />
              <DelButton onClick={() => delOwner(o.id)} />
            </div>
          </div>
        ))}
        <AddButton label="+ Add Owner" onClick={addOwner} style={{ marginBottom: '14px' }} />
      </div>

      <Card>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '12px' }}>
          Launch Readiness
          <span style={{ marginLeft: '8px', fontSize: '13px', color: '#B8D0DE', fontWeight: 400 }}>
            {checked.size}/{LAUNCH_ITEMS.length}
          </span>
        </div>
        {LAUNCH_ITEMS.map((item) => (
          <LaunchRow key={item} item={item} checked={checked.has(item)} onToggle={() => toggleItem(item)} />
        ))}
        <InsightCallout tone={readinessInsight.tone} style={{ marginTop: '12px' }}>
          {readinessInsight.text}
        </InsightCallout>
      </Card>
    </div>
  )
}
