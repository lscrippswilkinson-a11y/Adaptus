import { useStageEditor } from '@/state/AppContext'
import { useAuth } from '@/state/AuthContext'
import { FieldCoach, InsightCallout, Card, Label, StageIntro, TextArea, TextInput } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { TipBox } from '@/components/TipBox'
import { SPONSOR_ACTIONS } from '@/data/constants'
import { coaching } from '@/data/coaching'

export function SponsorStage() {
  const { data, update } = useStageEditor('sponsor')
  const { user } = useAuth()

  /** Name to offer for the "this is me" shortcut, drawn from the Google profile. */
  const myName =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email ||
    null

  const toggleAction = (action: string) => {
    const cur = new Set(data.sponsorActions)
    if (cur.has(action)) cur.delete(action)
    else cur.add(action)
    update({ sponsorActions: [...cur] })
  }

  const actionsInsight = coaching.sponsor.actionsInsight(data.sponsorActions.length)
  const f = coaching.sponsor.fields

  const steps: WizardStep[] = [
    {
      id: 'name',
      title: 'Your sponsor',
      isFilled: !!data.name.trim(),
      summary: data.name,
      node: (
        <FieldCoach
          label={f.name.label}
          why={f.name.why}
          example={f.name.example}
          onUseExample={() => update({ name: f.name.example })}
        >
          <TextInput value={data.name} onCommit={(v) => update({ name: v })} placeholder="e.g., Elena Torres" />
          {myName && data.name !== myName && (
            <button
              type="button"
              onClick={() => update({ name: myName })}
              style={{
                marginTop: '8px',
                background: 'rgba(91,134,163,0.15)',
                border: '1px solid rgba(91,134,163,0.35)',
                borderRadius: '6px',
                padding: '6px 12px',
                color: 'var(--accent-text)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              The sponsor is me — use “{myName}”
            </button>
          )}
        </FieldCoach>
      ),
    },
    {
      id: 'role',
      title: 'Their role',
      isFilled: !!data.role.trim(),
      summary: data.role,
      node: (
        <FieldCoach
          label={f.role.label}
          why={f.role.why}
          example={f.role.example}
          onUseExample={() => update({ role: f.role.example })}
        >
          <TextInput value={data.role} onCommit={(v) => update({ role: v })} placeholder="e.g., Managing Partner" />
        </FieldCoach>
      ),
    },
    {
      id: 'actions',
      title: 'Sponsor actions',
      isFilled: data.sponsorActions.length > 0,
      summary: `${data.sponsorActions.length} action${data.sponsorActions.length === 1 ? '' : 's'} selected`,
      node: (
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
                    background: checked ? 'rgba(91,134,163,0.1)' : 'rgba(var(--fg),0.02)',
                    border: `1px solid ${checked ? 'rgba(91,134,163,0.3)' : 'rgba(var(--fg),0.06)'}`,
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
                      color: 'var(--on-accent)',
                      background: checked ? '#5B86A3' : 'transparent',
                      borderColor: checked ? '#5B86A3' : 'rgba(var(--fg),0.2)',
                    }}
                  >
                    {checked ? '✓' : ''}
                  </div>
                  <div style={{ fontSize: '13px', color: checked ? 'rgba(var(--fg),0.9)' : 'rgba(var(--fg),0.6)', lineHeight: 1.5 }}>
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
      ),
    },
    {
      id: 'commitments',
      title: 'Commitments',
      isFilled: !!data.commitments.trim(),
      summary: data.commitments,
      node: (
        <FieldCoach
          label={f.commitments.label}
          why={f.commitments.why}
          example={f.commitments.example}
          onUseExample={() => update({ commitments: f.commitments.example })}
        >
          <TextArea value={data.commitments} onCommit={(v) => update({ commitments: v })} placeholder="e.g., Personal video to all staff, co-present at all-hands..." rows={4} />
        </FieldCoach>
      ),
    },
    {
      id: 'escalationPath',
      title: 'Escalation path',
      isFilled: !!data.escalationPath.trim(),
      summary: data.escalationPath,
      node: (
        <FieldCoach
          label={f.escalationPath.label}
          why={f.escalationPath.why}
          example={f.escalationPath.example}
          onUseExample={() => update({ escalationPath: f.escalationPath.example })}
        >
          <TextArea value={data.escalationPath} onCommit={(v) => update({ escalationPath: v })} placeholder="e.g., Go-live blockers escalate same-day. Budget decisions go to sponsor + CFO..." rows={3} />
        </FieldCoach>
      ),
    },
  ]

  return (
    <StageFlow
      intro={
        <>
          <StageIntro icon={coaching.sponsor.icon}>{coaching.sponsor.intro}</StageIntro>
          <TipBox stageId="sponsor" />
        </>
      }
      steps={steps}
    />
  )
}
