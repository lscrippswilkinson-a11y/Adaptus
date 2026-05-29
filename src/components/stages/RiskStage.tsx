import { useStageEditor } from '@/state/AppContext'
import type { RiskItem } from '@/types'
import { AddButton, DelButton, InsightCallout, StageIntro, TextInput } from '@/components/ui'
import { TipBox } from '@/components/TipBox'
import { coaching } from '@/data/coaching'
import { RISK_CATS } from '@/data/constants'
import { avgRisk, riskColor, riskLabel } from '@/lib/format'
import { uid } from '@/lib/id'

const LIKELIHOOD = ['', 'Unlikely', 'Possible', 'Likely', 'Very Likely', 'Almost Certain']
const IMPACT = ['', 'Minimal', 'Minor', 'Moderate', 'Major', 'Severe']

function Slider({ label, value, labels, onChange }: { label: string; value: number; labels: string[]; onChange: (v: number) => void }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span className="cq-lbl">{label}</span>
        <span style={{ fontSize: '12px', color: '#B8D0DE', fontWeight: 600 }}>{labels[value]}</span>
      </div>
      <input type="range" min={1} max={5} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  )
}

export function RiskStage() {
  const { data, update } = useStageEditor('risk')
  const avg = avgRisk(data.items)

  const setItem = (id: number, patch: Partial<RiskItem>) =>
    update({ items: data.items.map((r) => (r.id === id ? { ...r, ...patch } : r)) })
  const delItem = (id: number) => update({ items: data.items.filter((r) => r.id !== id) })
  const addItem = () => update({ items: [...data.items, { id: uid(), category: 'People / Culture', description: '', likelihood: 3, impact: 3, mitigation: '' }] })

  const scoreInsight = coaching.risk.scoreInsight(avg)

  return (
    <div>
      <StageIntro icon={coaching.risk.icon}>{coaching.risk.intro}</StageIntro>
      <TipBox stageId="risk" />

      {avg !== null && (
        <div className="cq-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '34px', fontWeight: 800, color: riskColor(avg) }}>{avg}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Risk Score</div>
            </div>
            <div style={{ width: '1px', height: '44px', background: 'rgba(255,255,255,0.08)' }} />
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: riskColor(avg) }}>{riskLabel(avg)} Risk</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{data.items.length} items</div>
            </div>
            <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(avg / 10) * 100}%`, background: riskColor(avg), borderRadius: '4px', transition: 'width 0.5s' }} />
            </div>
          </div>
        </div>
      )}

      {scoreInsight && <InsightCallout tone={scoreInsight.tone} style={{ marginBottom: '14px' }}>{scoreInsight.text}</InsightCallout>}

      {data.items.map((r) => (
        <div className="cq-card" key={r.id}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
            <select className="cq-select" value={r.category} style={{ width: '160px', flexShrink: 0, color: '#B8D0DE' }} onChange={(e) => setItem(r.id, { category: e.target.value })}>
              {RISK_CATS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <TextInput value={r.description} onCommit={(v) => setItem(r.id, { description: v })} placeholder="Describe the risk... (e.g., staff keep using the old system)" style={{ flex: 1 }} />
            <DelButton onClick={() => delItem(r.id)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
            <Slider label="Likelihood" value={r.likelihood} labels={LIKELIHOOD} onChange={(v) => setItem(r.id, { likelihood: v })} />
            <Slider label="Impact" value={r.impact} labels={IMPACT} onChange={(v) => setItem(r.id, { impact: v })} />
          </div>
          <div>
            <div className="cq-lbl">Mitigation plan — your fix if this happens</div>
            <TextInput value={r.mitigation} onCommit={(v) => setItem(r.id, { mitigation: v })} placeholder="e.g., Run both systems in parallel for 2 weeks as a safety net" />
          </div>
        </div>
      ))}
      <AddButton label="+ Add Risk Item" onClick={addItem} />
    </div>
  )
}
