import { useStageEditor } from '@/state/AppContext'
import { useAuth } from '@/state/AuthContext'
import { AddButton, Card, DelButton, FieldCoach, InsightCallout, SectionTitle, TextInput } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { coaching } from '@/data/coaching'
import { getBusinessProfile } from '@/data/business'
import { uid } from '@/lib/id'

export function SponsorStage() {
  const { project, data, update } = useStageEditor('sponsor')
  const { user } = useAuth()
  // The backer example name and the suggested actions are tailored to the business type.
  const profile = getBusinessProfile(project?.businessType)
  const sponsorEx = profile.examples.sponsor

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
    update({ sponsorActions: [...actions, { id: uid(), text: t, done: false }] })
  }
  // "Add another action" drops in a blank card the user then fills in,
  // mirroring how the Training and Groups review tabs add an item.
  const addBlankAction = () => update({ sponsorActions: [...actions, { id: uid(), text: '', done: false }] })
  const setActionText = (id: number, text: string) =>
    update({ sponsorActions: actions.map((a) => (a.id === id ? { ...a, text } : a)) })
  const delAction = (id: number) => update({ sponsorActions: actions.filter((a) => a.id !== id) })

  // Pre-set actions become quick-add suggestions; hide ones already on the list.
  const suggestions = profile.sponsorActions.filter((s) => !actions.some((a) => a.text === s))

  const actionsInsight = coaching.sponsor.actionsInsight(actions.length)
  const f = coaching.sponsor.fields
  const noSponsor = data.noSponsor

  // Declaring "no sponsor" clears any half-entered name so the brief and
  // dashboard read cleanly as "not identified" rather than a stale name.
  const toggleNoSponsor = (v: boolean) =>
    update(v ? { noSponsor: true, name: '', role: '' } : { noSponsor: false })

  // The backer and the actions they've agreed to are one thing, so they share a
  // review row: the name, with their actions listed under it.
  const reviewGroup = 'backer'

  const nameStep: WizardStep = {
    id: 'name',
    title: 'Your backer',
    reviewGroup,
    isFilled: noSponsor || !!data.name.trim(),
    summary: noSponsor ? 'No senior backer — flagged as a risk' : data.name,
    node: (
      <FieldCoach label={f.name.label} why={f.name.why}>
        {!noSponsor && (
          <>
            <TextInput value={data.name} onCommit={(v) => update({ name: v })} placeholder={`e.g., ${sponsorEx.name}`} />
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
                I’m the backer, use “{myName}”
              </button>
            )}
          </>
        )}

        {/* Escape hatch: many real projects launch without a named sponsor. */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '9px', marginTop: '14px', cursor: 'pointer', fontSize: '13px', color: 'rgba(var(--fg),0.7)' }}>
          <input type="checkbox" checked={noSponsor} onChange={(e) => toggleNoSponsor(e.target.checked)} style={{ width: '17px', height: '17px', accentColor: '#ef4444', cursor: 'pointer', flexShrink: 0 }} />
          We don’t have a senior backer (yet)
        </label>

        {noSponsor && (
          <InsightCallout tone="warn" style={{ marginTop: '12px' }}>{coaching.sponsor.noSponsorRisk}</InsightCallout>
        )}
      </FieldCoach>
    ),
  }

  // Blank cards (added but never filled in) aren't commitments, so they don't
  // count towards the review tick and don't show up in the read-back.
  const namedActions = actions.filter((a) => a.text.trim())

  const actionsStep: WizardStep = {
    id: 'actions',
    title: 'Backer actions',
    reviewGroup,
    isFilled: namedActions.length > 0,
    emptyLabel: 'No actions agreed yet',
    summary: namedActions.length ? (
      <ul style={{ margin: '2px 0 0', paddingLeft: '17px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {namedActions.map((a) => (
          <li key={a.id}>{a.text}</li>
        ))}
      </ul>
    ) : undefined,
    node: (
      <Card>
        <SectionTitle>What your backer will do</SectionTitle>
        <p style={{ fontSize: '13px', color: 'rgba(var(--fg),0.62)', lineHeight: 1.6, margin: '4px 0 0' }}>
          Build this <strong>with your backer</strong>, not just for them. Each action you add becomes a checklist item
          on your launch checklist, where you can give it an owner and a due date and check it off as it’s done.
        </p>

        <InsightCallout tone="info" style={{ margin: '14px 0' }}>
          We recommend setting aside time with your backer to walk through each action together. Agreeing on them face to
          face, and checking back in on progress, is what turns a list into real, visible backing.
        </InsightCallout>

        {actions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
            {actions.map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TextInput value={a.text} onCommit={(v) => setActionText(a.id, v)} placeholder="Describe this action…" style={{ flex: 1, minWidth: 0 }} />
                <DelButton onClick={() => delAction(a.id)} />
              </div>
            ))}
          </div>
        )}

        {suggestions.length > 0 && (
          <div style={{ margin: '0 0 12px' }}>
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

        <AddButton label={actions.length ? 'Add another action' : 'Add an action'} onClick={addBlankAction} />

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
