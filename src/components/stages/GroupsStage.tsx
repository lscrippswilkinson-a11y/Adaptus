import { useStageEditor } from '@/state/AppContext'
import type { ImpactedGroup, Impact, Readiness } from '@/types'
import { AddButton, DelButton, InsightCallout, TextInput } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { coaching } from '@/data/coaching'
import { uid } from '@/lib/id'

const IMPACT_BG: Record<Impact, string> = { High: 'rgba(239,68,68,0.15)', Medium: 'rgba(245,158,11,0.15)', Low: 'rgba(34,197,94,0.15)' }
const READY_BG: Record<Readiness, string> = { High: 'rgba(34,197,94,0.15)', Medium: 'rgba(245,158,11,0.15)', Low: 'rgba(239,68,68,0.15)' }
const IMPACT_HELP: Record<Impact, string> = { High: 'Major workflow/role change', Medium: 'Partial process change', Low: 'Minimal day-to-day effect' }
const READY_HELP: Record<Readiness, string> = { High: 'Aware, willing, capacity to change', Medium: 'Some awareness, mixed willingness', Low: 'Unaware or resistant to change' }
const LEVELS_3 = ['High', 'Medium', 'Low'] as const

export function GroupsStage() {
  const { data, update } = useStageEditor('groups')

  const setGroup = (id: number, patch: Partial<ImpactedGroup>) =>
    update({ groups: data.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)) })
  const delGroup = (id: number) => update({ groups: data.groups.filter((g) => g.id !== id) })
  const addGroup = () => update({ groups: [...data.groups, { id: uid(), name: '', size: '', impact: 'High', readiness: 'Low' }] })

  const namedCount = data.groups.filter((g) => g.name.trim()).length

  const steps: WizardStep[] = [{
    id: 'groups',
    title: 'Identify impacted groups',
    isFilled: data.groups.some((g) => g.name.trim()),
    summary: namedCount ? `${namedCount} group${namedCount === 1 ? '' : 's'} identified` : undefined,
    node: (
    <div>
      {data.groups.map((g) => {
        const insight = coaching.groups.insight(g)
        return (
          <div className="cq-card" key={g.id}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
              <TextInput value={g.name} onCommit={(v) => setGroup(g.id, { name: v })} placeholder="Group name (e.g., Billing team)" style={{ flex: 1, minWidth: 0 }} />
              <TextInput value={g.size} onCommit={(v) => setGroup(g.id, { size: v })} placeholder="Size" style={{ width: '80px', flexShrink: 0 }} />
              <DelButton onClick={() => delGroup(g.id)} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <div className="cq-lbl">Impact Level</div>
                <select className="cq-select" value={g.impact} style={{ background: IMPACT_BG[g.impact] }} onChange={(e) => setGroup(g.id, { impact: e.target.value as Impact })}>
                  {LEVELS_3.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <div style={{ fontSize: '11px', color: 'rgba(var(--fg),0.35)', marginTop: '4px', lineHeight: 1.4 }}>{IMPACT_HELP[g.impact]}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="cq-lbl">Change Readiness</div>
                <select className="cq-select" value={g.readiness} style={{ background: READY_BG[g.readiness] }} onChange={(e) => setGroup(g.id, { readiness: e.target.value as Readiness })}>
                  {LEVELS_3.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <div style={{ fontSize: '11px', color: 'rgba(var(--fg),0.35)', marginTop: '4px', lineHeight: 1.4 }}>{READY_HELP[g.readiness]}</div>
              </div>
            </div>
            {insight && <InsightCallout tone={insight.tone} style={{ marginTop: '12px' }}>{insight.text}</InsightCallout>}
          </div>
        )
      })}
      <AddButton label="+ Add Impacted Group" onClick={addGroup} />
    </div>
    ),
  }]

  return <StageFlow stageId="groups" icon={coaching.groups.icon} blurb={coaching.groups.intro} steps={steps} />
}
