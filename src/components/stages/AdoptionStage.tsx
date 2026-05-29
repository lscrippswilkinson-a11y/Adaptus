import { useStageEditor } from '@/state/AppContext'
import type { AdoptionMetric } from '@/types'
import { AddButton, DelButton, FieldCoach, InsightCallout, StageIntro, TextArea, TextInput } from '@/components/ui'
import { TipBox } from '@/components/TipBox'
import { METRIC_UNITS } from '@/data/constants'
import { coaching } from '@/data/coaching'
import { uid } from '@/lib/id'

export function AdoptionStage() {
  const { data, update } = useStageEditor('adoption')

  const setMetric = (id: number, patch: Partial<AdoptionMetric>) =>
    update({ metrics: data.metrics.map((m) => (m.id === id ? { ...m, ...patch } : m)) })
  const delMetric = (id: number) => update({ metrics: data.metrics.filter((m) => m.id !== id) })
  const addMetric = () => update({ metrics: [...data.metrics, { id: uid(), name: '', target: '', current: '', unit: '%' }] })

  const insight = coaching.adoption.insight(data.metrics)

  return (
    <div>
      <StageIntro icon={coaching.adoption.icon}>{coaching.adoption.intro}</StageIntro>
      <TipBox stageId="adoption" />

      {insight && <InsightCallout tone={insight.tone} style={{ marginBottom: '12px' }}>{insight.text}</InsightCallout>}

      {data.metrics.map((m) => {
        const hasProgress = m.current && m.target
        const p2 = hasProgress ? Math.min(100, Math.round((parseFloat(m.current) / parseFloat(m.target)) * 100)) : 0
        return (
          <div className="cq-card" key={m.id}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: hasProgress ? '10px' : 0 }}>
              <TextInput value={m.name} onCommit={(v) => setMetric(m.id, { name: v })} placeholder="Metric name" style={{ flex: 1 }} />
              <TextInput value={m.target} onCommit={(v) => setMetric(m.id, { target: v })} placeholder="Target" style={{ width: '80px', flexShrink: 0 }} />
              <TextInput value={m.current} onCommit={(v) => setMetric(m.id, { current: v })} placeholder="Current" style={{ width: '80px', flexShrink: 0 }} />
              <select className="cq-select" value={m.unit} style={{ width: '70px', flexShrink: 0 }} onChange={(e) => setMetric(m.id, { unit: e.target.value })}>
                {METRIC_UNITS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              <DelButton onClick={() => delMetric(m.id)} />
            </div>
            {hasProgress && (
              <>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${p2}%`, background: 'linear-gradient(90deg,#5B86A3,#8FB3C7)', borderRadius: '3px', transition: 'width 0.4s' }} />
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '3px' }}>{p2}% of target</div>
              </>
            )}
          </div>
        )
      })}
      <AddButton label="+ Add Adoption Metric" onClick={addMetric} style={{ marginBottom: '14px' }} />

      <FieldCoach
        label={coaching.adoption.fields.notes.label}
        why={coaching.adoption.fields.notes.why}
        example={coaching.adoption.fields.notes.example}
        onUseExample={() => update({ notes: coaching.adoption.fields.notes.example })}
      >
        <TextArea value={data.notes} onCommit={(v) => update({ notes: v })} placeholder="What are you hearing from the field?" rows={4} />
      </FieldCoach>
    </div>
  )
}
