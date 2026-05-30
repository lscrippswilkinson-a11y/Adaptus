import { useStageEditor } from '@/state/AppContext'
import type { ResistanceItem, Severity } from '@/types'
import { AddButton, DelButton, FieldCoach, InsightCallout, TextArea, TextInput } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { RESISTANCE_TYPES } from '@/data/constants'
import { coaching } from '@/data/coaching'
import { uid } from '@/lib/id'

const SEV_BG: Record<Severity, string> = { High: 'rgba(239,68,68,0.15)', Medium: 'rgba(245,158,11,0.15)', Low: 'rgba(34,197,94,0.15)' }
const SEV_OPTS = ['High', 'Medium', 'Low'] as const

export function ResistanceStage() {
  const { data, update } = useStageEditor('resistance')

  const setItem = (id: number, patch: Partial<ResistanceItem>) =>
    update({ items: data.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) })
  const delItem = (id: number) => update({ items: data.items.filter((it) => it.id !== id) })
  const addItem = () => update({ items: [...data.items, { id: uid(), type: 'Fear of job loss', group: '', severity: 'Medium', intervention: '' }] })

  const hasHighSeverity = data.items.some((it) => it.severity === 'High')

  const steps: WizardStep[] = [{
    id: 'resistance',
    title: 'Plan for resistance',
    isFilled: data.items.length > 0 || !!(data.generalPlan && data.generalPlan.trim()),
    summary: data.items.length ? `${data.items.length} source${data.items.length === 1 ? '' : 's'} of resistance` : undefined,
    node: (
    <div>
      {data.items.map((item) => (
        <div className="cq-card" key={item.id}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
            <select className="cq-select" value={item.type} style={{ flex: 1, color: 'var(--text)' }} onChange={(e) => setItem(item.id, { type: e.target.value })}>
              {RESISTANCE_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <DelButton onClick={() => delItem(item.id)} />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <div style={{ flex: 1 }}>
              <div className="cq-lbl">Affected Group</div>
              <TextInput value={item.group} onCommit={(v) => setItem(item.id, { group: v })} placeholder="e.g., Sales Team, Middle Managers" />
            </div>
            <div style={{ width: '140px', flexShrink: 0 }}>
              <div className="cq-lbl">Severity</div>
              <select className="cq-select" value={item.severity} style={{ background: SEV_BG[item.severity] }} onChange={(e) => setItem(item.id, { severity: e.target.value as Severity })}>
                {SEV_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div>
            <div className="cq-lbl">Intervention — how will you address this?</div>
            <div style={{ fontSize: '11px', color: 'rgba(var(--fg),0.35)', marginBottom: '6px' }}>Be specific: who does what, by when?</div>
            <TextInput value={item.intervention} onCommit={(v) => setItem(item.id, { intervention: v })} placeholder="e.g., Town hall + demo, dedicated coaching sprint..." />
          </div>
        </div>
      ))}
      <AddButton label="+ Add Resistance Item" onClick={addItem} />

      {hasHighSeverity && (
        <InsightCallout tone={coaching.resistance.highSeverity.tone} style={{ marginBottom: '16px' }}>
          {coaching.resistance.highSeverity.text}
        </InsightCallout>
      )}

      <FieldCoach
        label={coaching.resistance.fields.generalPlan.label}
        why={coaching.resistance.fields.generalPlan.why}
        example={coaching.resistance.fields.generalPlan.example}
        onUseExample={() => update({ generalPlan: coaching.resistance.fields.generalPlan.example })}
      >
        <TextArea value={data.generalPlan} onCommit={(v) => update({ generalPlan: v })} placeholder="e.g., Weekly pulse survey for 8 weeks, any score below 3/5 triggers manager check-in within 48 hours..." rows={4} />
      </FieldCoach>
    </div>
    ),
  }]

  return <StageFlow stageId="resistance" icon={coaching.resistance.icon} blurb={coaching.resistance.intro} steps={steps} />
}
