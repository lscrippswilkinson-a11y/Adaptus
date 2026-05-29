import { useStageEditor } from '@/state/AppContext'
import { FieldCoach, InsightCallout, Card, Label, StageIntro, TextArea, TextInput } from '@/components/ui'
import { TipBox } from '@/components/TipBox'
import { SPONSOR_ACTIONS } from '@/data/constants'
import { coaching } from '@/data/coaching'

export function SponsorStage() {
  const { data, update } = useStageEditor('sponsor')

  const toggleAction = (action: string) => {
    const cur = new Set(data.sponsorActions)
    if (cur.has(action)) cur.delete(action)
    else cur.add(action)
    update({ sponsorActions: [...cur] })
  }

  const actionsInsight = coaching.sponsor.actionsInsight(data.sponsorActions.length)

  return (
    <>
      <StageIntro icon={coaching.sponsor.icon}>{coaching.sponsor.intro}</StageIntro>
      <TipBox stageId="sponsor" />

      <FieldCoach
        label={coaching.sponsor.fields.name.label}
        why={coaching.sponsor.fields.name.why}
        example={coaching.sponsor.fields.name.example}
        onUseExample={() => update({ name: coaching.sponsor.fields.name.example })}
      >
        <TextInput value={data.name} onCommit={(v) => update({ name: v })} placeholder="e.g., Elena Torres" />
      </FieldCoach>

      <FieldCoach
        label={coaching.sponsor.fields.role.label}
        why={coaching.sponsor.fields.role.why}
        example={coaching.sponsor.fields.role.example}
        onUseExample={() => update({ role: coaching.sponsor.fields.role.example })}
      >
        <TextInput value={data.role} onCommit={(v) => update({ role: v })} placeholder="e.g., Managing Partner" />
      </FieldCoach>

      <Card>
        <Label>Sponsor Actions — what will this sponsor actively do?</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          {SPONSOR_ACTIONS.map((action) => {
            const checked = data.sponsorActions.includes(action)
            return (
              <div
                key={action}
                onClick={() => toggleAction(action)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '8px 12px',
                  background: checked ? 'rgba(91,134,163,0.1)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${checked ? 'rgba(91,134,163,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '4px',
                    border: '1.5px solid',
                    flexShrink: 0,
                    marginTop: '1px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    color: '#fff',
                    background: checked ? '#5B86A3' : 'transparent',
                    borderColor: checked ? '#5B86A3' : 'rgba(255,255,255,0.2)',
                  }}
                >
                  {checked ? '✓' : ''}
                </div>
                <div style={{ fontSize: '13px', color: checked ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                  {action}
                </div>
              </div>
            )
          })}
        </div>
        {actionsInsight && (
          <InsightCallout tone={actionsInsight.tone} style={{ marginTop: '12px' }}>
            {actionsInsight.text}
          </InsightCallout>
        )}
      </Card>

      <FieldCoach
        label={coaching.sponsor.fields.commitments.label}
        why={coaching.sponsor.fields.commitments.why}
        example={coaching.sponsor.fields.commitments.example}
        onUseExample={() => update({ commitments: coaching.sponsor.fields.commitments.example })}
      >
        <TextArea value={data.commitments} onCommit={(v) => update({ commitments: v })} placeholder="e.g., Personal video to all staff, co-present at all-hands..." rows={4} />
      </FieldCoach>

      <FieldCoach
        label={coaching.sponsor.fields.escalationPath.label}
        why={coaching.sponsor.fields.escalationPath.why}
        example={coaching.sponsor.fields.escalationPath.example}
        onUseExample={() => update({ escalationPath: coaching.sponsor.fields.escalationPath.example })}
      >
        <TextArea value={data.escalationPath} onCommit={(v) => update({ escalationPath: v })} placeholder="e.g., Go-live blockers escalate same-day. Budget decisions go to sponsor + CFO..." rows={3} />
      </FieldCoach>
    </>
  )
}
