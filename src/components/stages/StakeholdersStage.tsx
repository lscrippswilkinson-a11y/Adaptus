import { useStageEditor } from '@/state/AppContext'
import type { Influence, StakeholderRow, Support } from '@/types'
import { AddButton, DelButton, InsightCallout, TextInput } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { coaching } from '@/data/coaching'
import { uid } from '@/lib/id'

const supportColor = (s: Support): string =>
  s === 'Advocate' ? '#22c55e' : s === 'Resistant' ? '#ef4444' : s === 'Neutral' ? '#f59e0b' : '#5B86A3'
const SUPPORT_HELP: Record<Support, string> = { Advocate: 'Actively championing', Neutral: 'Waiting to see', Resistant: 'Pushing back', Unknown: 'Not yet assessed' }
const INFLUENCE_HELP: Record<Influence, string> = { High: 'Can approve, block, or mobilize', Medium: 'Influences peers', Low: 'Limited reach' }
const INFLUENCE_OPTS = ['High', 'Medium', 'Low'] as const
const SUPPORT_OPTS = ['Advocate', 'Neutral', 'Resistant', 'Unknown'] as const

export function StakeholdersStage() {
  const { data, update } = useStageEditor('stakeholders')

  const setRow = (id: number, patch: Partial<StakeholderRow>) =>
    update({ rows: data.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) })
  const delRow = (id: number) => update({ rows: data.rows.filter((r) => r.id !== id) })
  const addRow = () => update({ rows: [...data.rows, { id: uid(), name: '', role: '', influence: 'High', support: 'Neutral', action: '' }] })

  const summary = coaching.stakeholders.summary(data.rows)
  const namedCount = data.rows.filter((r) => r.name.trim()).length

  const steps: WizardStep[] = [{
    id: 'coalition',
    title: 'Map your coalition',
    isFilled: namedCount > 0,
    summary: namedCount ? `${namedCount} stakeholder${namedCount === 1 ? '' : 's'} mapped` : undefined,
    node: (
    <div>
      {summary && <InsightCallout tone={summary.tone} style={{ marginBottom: '14px' }}>{summary.text}</InsightCallout>}

      {data.rows.map((r) => {
        const insight = coaching.stakeholders.rowInsight(r)
        return (
          <div className="cq-card" key={r.id}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
              <TextInput value={r.name} onCommit={(v) => setRow(r.id, { name: v })} placeholder="Full name" style={{ flex: 1, minWidth: 0 }} />
              <TextInput value={r.role} onCommit={(v) => setRow(r.id, { role: v })} placeholder="Title / Role" style={{ flex: 1, minWidth: 0 }} />
              <DelButton onClick={() => delRow(r.id)} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <div style={{ flex: 1 }}>
                <div className="cq-lbl">Influence</div>
                <select className="cq-select" value={r.influence} onChange={(e) => setRow(r.id, { influence: e.target.value as Influence })}>
                  {INFLUENCE_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <div style={{ fontSize: '11px', color: 'rgba(var(--fg),0.35)', marginTop: '4px', lineHeight: 1.4 }}>{INFLUENCE_HELP[r.influence]}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="cq-lbl">Support Status</div>
                <select className="cq-select" value={r.support} style={{ color: supportColor(r.support) }} onChange={(e) => setRow(r.id, { support: e.target.value as Support })}>
                  {SUPPORT_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <div style={{ fontSize: '11px', color: 'rgba(var(--fg),0.35)', marginTop: '4px', lineHeight: 1.4 }}>{SUPPORT_HELP[r.support]}</div>
              </div>
            </div>
            <div>
              <div className="cq-lbl">Engagement action</div>
              <div style={{ fontSize: '11px', color: 'rgba(var(--fg),0.4)', marginBottom: '6px' }}>
                What will you do to move this person toward Advocate?
              </div>
              <TextInput value={r.action} onCommit={(v) => setRow(r.id, { action: v })} placeholder="e.g., 1:1 briefing before all-hands..." />
            </div>
            {insight && <InsightCallout tone={insight.tone} style={{ marginTop: '12px' }}>{insight.text}</InsightCallout>}
          </div>
        )
      })}
      <AddButton label="+ Add Stakeholder" onClick={addRow} />
    </div>
    ),
  }]

  return <StageFlow stageId="stakeholders" icon={coaching.stakeholders.icon} blurb={coaching.stakeholders.intro} steps={steps} />
}
