import { useStageEditor } from '@/state/AppContext'
import { useAuth } from '@/state/AuthContext'
import { FieldCoach, InsightCallout, Card, SectionTitle, TextInput } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { SPONSOR_ACTIONS } from '@/data/constants'
import { coaching } from '@/data/coaching'

/** The five highest-impact sponsor actions; the rest collapse into an "Other" box. */
const TOP_SPONSOR_ACTIONS = SPONSOR_ACTIONS.slice(0, 5)

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

  // Anything selected that isn't one of the top 5 is the free-text "Other" entry.
  const otherAction = data.sponsorActions.find((a) => !TOP_SPONSOR_ACTIONS.includes(a)) ?? ''
  const setOtherAction = (v: string) => {
    const kept = data.sponsorActions.filter((a) => TOP_SPONSOR_ACTIONS.includes(a))
    update({ sponsorActions: v.trim() ? [...kept, v.trim()] : kept })
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
          <SectionTitle>Sponsor Actions — what will this sponsor actively do?</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {TOP_SPONSOR_ACTIONS.map((action) => {
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
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '13px', color: 'rgba(var(--fg),0.6)', marginBottom: '6px' }}>Other</div>
            <TextInput value={otherAction} onCommit={setOtherAction} placeholder="Add another action this sponsor will take…" />
          </div>
          {actionsInsight && (
            <InsightCallout tone={actionsInsight.tone} style={{ marginTop: '12px' }}>
              {actionsInsight.text}
            </InsightCallout>
          )}
        </Card>
      ),
    },
  ]

  return <StageFlow stageId="sponsor" icon={coaching.sponsor.icon} blurb={coaching.sponsor.intro} steps={steps} />
}
