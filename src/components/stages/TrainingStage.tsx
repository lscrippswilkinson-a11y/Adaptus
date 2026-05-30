import { useStageEditor } from '@/state/AppContext'
import type { TrainingItem } from '@/types'
import { AddButton, DelButton, InsightCallout, StageIntro, TextInput } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { TipBox } from '@/components/TipBox'
import { TRAINING_FORMATS } from '@/data/constants'
import { coaching } from '@/data/coaching'
import { uid } from '@/lib/id'

export function TrainingStage() {
  const { data, update } = useStageEditor('training')

  const setItem = (id: number, patch: Partial<TrainingItem>) =>
    update({ items: data.items.map((t) => (t.id === id ? { ...t, ...patch } : t)) })
  const delItem = (id: number) => update({ items: data.items.filter((t) => t.id !== id) })
  const addItem = () => update({ items: [...data.items, { id: uid(), title: '', audience: '', format: 'Workshop', duration: '', owner: '', done: false }] })

  const steps: WizardStep[] = [{
    id: 'training',
    title: 'Plan the training',
    isFilled: data.items.length > 0,
    summary: data.items.length ? `${data.items.length} training activit${data.items.length === 1 ? 'y' : 'ies'}` : undefined,
    node: (
    <div>
      <InsightCallout tone={coaching.training.managersFirst.tone} style={{ marginBottom: '16px' }}>
        {coaching.training.managersFirst.text}
      </InsightCallout>
      {data.items.map((t) => (
        <div className="cq-card" key={t.id} style={{ borderLeft: t.done ? '2px solid #22c55e' : '2px solid transparent' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <button
              type="button"
              onClick={() => setItem(t.id, { done: !t.done })}
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '6px',
                border: '1.5px solid',
                flexShrink: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: t.done ? '#22c55e' : 'transparent',
                borderColor: t.done ? '#22c55e' : 'rgba(var(--fg),0.2)',
                color: 'var(--text)',
                fontSize: '12px',
                fontFamily: 'inherit',
              }}
            >
              {t.done ? '✓' : ''}
            </button>
            <TextInput value={t.title} onCommit={(v) => setItem(t.id, { title: v })} placeholder="Training title" style={{ flex: 1 }} />
            <DelButton onClick={() => delItem(t.id)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 90px 1fr', gap: '8px', paddingLeft: '32px' }}>
            <TextInput value={t.audience} onCommit={(v) => setItem(t.id, { audience: v })} placeholder="Audience" />
            <select className="cq-select" value={t.format} onChange={(e) => setItem(t.id, { format: e.target.value })}>
              {TRAINING_FORMATS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <TextInput value={t.duration} onCommit={(v) => setItem(t.id, { duration: v })} placeholder="Duration" />
            <TextInput value={t.owner} onCommit={(v) => setItem(t.id, { owner: v })} placeholder="Owner" />
          </div>
        </div>
      ))}
      <AddButton label="+ Add Training Activity" onClick={addItem} />
    </div>
    ),
  }]

  return (
    <StageFlow
      intro={
        <>
          <StageIntro icon={coaching.training.icon}>{coaching.training.intro}</StageIntro>
          <TipBox stageId="training" />
        </>
      }
      steps={steps}
    />
  )
}
