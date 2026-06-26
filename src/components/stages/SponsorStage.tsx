import { useState } from 'react'
import { useStageEditor } from '@/state/AppContext'
import { useAuth } from '@/state/AuthContext'
import { AddButton, Card, DelButton, FieldCoach, InsightCallout, Label, SectionTitle, TextArea, TextInput } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { SPONSOR_ACTIONS } from '@/data/constants'
import { coaching } from '@/data/coaching'
import { uid } from '@/lib/id'

export function SponsorStage() {
  const { data, update } = useStageEditor('sponsor')
  const { user } = useAuth()
  const [draft, setDraft] = useState('')

  /** Name to offer for the "this is me" shortcut, drawn from the Google profile. */
  const myName =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email ||
    null

  const actions = data.sponsorActions

  const addAction = (text: string) => {
    const t = text.trim()
    if (!t) return
    // Skip exact duplicates so re-clicking a suggestion is a no-op.
    if (actions.some((a) => a.text.toLowerCase() === t.toLowerCase())) return
    update({ sponsorActions: [...actions, { id: uid(), text: t, done: false, notes: '' }] })
  }
  const submitDraft = () => {
    addAction(draft)
    setDraft('')
  }
  const setActionText = (id: number, text: string) =>
    update({ sponsorActions: actions.map((a) => (a.id === id ? { ...a, text } : a)) })
  const setActionNotes = (id: number, notes: string) =>
    update({ sponsorActions: actions.map((a) => (a.id === id ? { ...a, notes } : a)) })
  const toggleActionDone = (id: number) =>
    update({ sponsorActions: actions.map((a) => (a.id === id ? { ...a, done: !a.done } : a)) })
  const delAction = (id: number) => update({ sponsorActions: actions.filter((a) => a.id !== id) })

  // Pre-set actions become quick-add suggestions; hide ones already on the list.
  const suggestions = SPONSOR_ACTIONS.filter((s) => !actions.some((a) => a.text === s))

  const actionsInsight = coaching.sponsor.actionsInsight(actions.length)
  const f = coaching.sponsor.fields
  const noSponsor = data.noSponsor

  // Declaring "no sponsor" clears any half-entered name so the brief and
  // dashboard read cleanly as "not identified" rather than a stale name.
  const toggleNoSponsor = (v: boolean) =>
    update(v ? { noSponsor: true, name: '', role: '' } : { noSponsor: false })

  const nameStep: WizardStep = {
    id: 'name',
    title: 'Your sponsor',
    isFilled: noSponsor || !!data.name.trim(),
    summary: noSponsor ? 'No executive sponsor — flagged as a risk' : data.name,
    node: (
      <FieldCoach
        label={f.name.label}
        why={f.name.why}
        example={f.name.example}
        onUseExample={() => update({ name: f.name.example })}
      >
        {!noSponsor && (
          <>
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
                The sponsor is me, use “{myName}”
              </button>
            )}
          </>
        )}

        {/* Escape hatch: many real projects launch without a named sponsor. */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '9px', marginTop: '14px', cursor: 'pointer', fontSize: '13px', color: 'rgba(var(--fg),0.7)' }}>
          <input type="checkbox" checked={noSponsor} onChange={(e) => toggleNoSponsor(e.target.checked)} style={{ width: '17px', height: '17px', accentColor: '#ef4444', cursor: 'pointer', flexShrink: 0 }} />
          We don’t have an executive sponsor (yet)
        </label>

        {noSponsor && (
          <InsightCallout tone="warn" style={{ marginTop: '12px' }}>{coaching.sponsor.noSponsorRisk}</InsightCallout>
        )}
      </FieldCoach>
    ),
  }

  const actionsStep: WizardStep = {
    id: 'actions',
    title: 'Sponsor actions',
    isFilled: actions.length > 0,
    summary: actions.length ? `${actions.length} action${actions.length === 1 ? '' : 's'} planned` : undefined,
    node: (
      <Card>
        <SectionTitle>Sponsor Action Plan</SectionTitle>
        <p style={{ fontSize: '13px', color: 'rgba(var(--fg),0.62)', lineHeight: 1.6, margin: '4px 0 0' }}>
          Build this <strong>with your sponsor</strong>, not just for them. Each action is a shared commitment, and the
          plan below is your living roadmap, check items off and log progress as the change rolls out.
        </p>

        <InsightCallout tone="info" style={{ margin: '14px 0' }}>
          We recommend setting aside time with your sponsor to walk through each action together. Agreeing them face to
          face, and checking back in on progress, is what turns a list into real, visible backing.
        </InsightCallout>

        <Label>Add an action your sponsor will commit to</Label>
        {suggestions.length > 0 && (
          <div style={{ margin: '4px 0 10px' }}>
            <div style={{ fontSize: '11.5px', color: 'rgba(var(--fg),0.45)', marginBottom: '6px' }}>Suggestions, tap to add:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addAction(s)}
                  style={{ fontSize: '12px', color: 'var(--accent-text)', background: 'rgba(91,134,163,0.12)', border: '1px solid rgba(91,134,163,0.3)', borderRadius: '999px', padding: '5px 11px', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="cq-input"
            value={draft}
            placeholder="e.g., Record a 2-minute ‘why’ video for all staff"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitDraft()}
          />
          <AddButton label="Add" onClick={submitDraft} style={{ width: 'auto', flexShrink: 0, padding: '9px 18px' }} />
        </div>

        {actions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
            {actions.map((a) => (
              <div key={a.id} style={{ background: 'rgba(var(--fg),0.02)', border: '1px solid rgba(var(--fg),0.07)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => toggleActionDone(a.id)}
                    aria-label={a.done ? 'Mark not done' : 'Mark done'}
                    style={{ width: '20px', height: '20px', borderRadius: '5px', border: '1.5px solid', flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--on-accent)', background: a.done ? '#5B86A3' : 'transparent', borderColor: a.done ? '#5B86A3' : 'rgba(var(--fg),0.2)', fontFamily: 'inherit' }}
                  >
                    {a.done ? '✓' : ''}
                  </button>
                  <TextInput value={a.text} onCommit={(v) => setActionText(a.id, v)} placeholder="Describe this action…" style={{ flex: 1, minWidth: 0 }} />
                  <DelButton onClick={() => delAction(a.id)} />
                </div>
                <div style={{ marginTop: '8px' }}>
                  <TextArea
                    value={a.notes}
                    onCommit={(v) => setActionNotes(a.id, v)}
                    placeholder="Progress & updates — for both you and your sponsor to add as this moves"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {actionsInsight && (
          <InsightCallout tone={actionsInsight.tone} style={{ marginTop: '12px' }}>
            {actionsInsight.text}
          </InsightCallout>
        )}
      </Card>
    ),
  }

  // With no sponsor, asking for their actions is moot, show just the
  // declaration step (which carries the risk flag).
  const steps: WizardStep[] = noSponsor ? [nameStep] : [nameStep, actionsStep]

  return <StageFlow stageId="sponsor" icon={coaching.sponsor.icon} blurb={coaching.sponsor.intro} steps={steps} />
}
