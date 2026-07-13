import { useEffect, useRef, useState } from 'react'
import { useStageEditor } from '@/state/AppContext'
import type { CommsPhase, CommsTouchpoint } from '@/types'
import { AddButton, Card, DelButton, InsightCallout, Label, Select, TextArea, TextInput } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { getBusinessProfile } from '@/data/business'
import { coaching } from '@/data/coaching'
import { uid } from '@/lib/id'

const PHASES: CommsPhase[] = ['before', 'launch', 'after']

type Repeat = NonNullable<CommsTouchpoint['repeat']>
const REPEAT_LABELS: Record<Repeat, string> = { once: 'Does not repeat', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }
const REPEAT_FROM_LABEL = Object.fromEntries(Object.entries(REPEAT_LABELS).map(([k, v]) => [v, k])) as Record<string, Repeat>

const linkBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--accent-text)',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 600,
  padding: 0,
  fontFamily: 'inherit',
}

const hintStyle: React.CSSProperties = {
  fontSize: '11.5px',
  color: 'rgba(var(--fg),0.5)',
  lineHeight: 1.5,
  margin: '2px 0 6px',
}

const fillBtnStyle: React.CSSProperties = {
  background: 'rgba(91,134,163,0.15)',
  border: '1px solid rgba(91,134,163,0.35)',
  borderRadius: '6px',
  padding: '6px 12px',
  color: 'var(--accent-text)',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

/**
 * One planned touchpoint: the logistics row (when/audience/channel) plus an
 * expandable drafter that coaches an effective message, context, core
 * message, and a clear call to action, and assembles a copy-ready draft.
 */
function TouchpointCard({
  t,
  channelOptions,
  audienceOptions,
  onChange,
  onDelete,
}: {
  t: CommsTouchpoint
  channelOptions: string[]
  audienceOptions: string[]
  onChange: (patch: Partial<CommsTouchpoint>) => void
  onDelete: () => void
}) {
  const d = coaching.comms.draft
  // Open by default if the user has already started drafting this one.
  const [open, setOpen] = useState(!!(t.greeting || t.context || t.cta || t.closer || t.draft))
  const [copied, setCopied] = useState(false)
  // The written-message drafter fits any email/memo channel, whatever the org profile calls it.
  const isWritten = /email|memo/i.test(t.channel)

  const buildDraft = () =>
    onChange({
      draft: d.assemble({ audience: t.audience, greeting: t.greeting, context: t.context, message: t.message, cta: t.cta, closer: t.closer }),
    })

  const copyDraft = async () => {
    if (!t.draft) return
    try {
      await navigator.clipboard.writeText(t.draft)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked, the text is still selectable in the field */
    }
  }

  return (
    <div style={{ background: 'rgba(var(--fg),0.03)', border: '1px solid rgba(var(--fg),0.07)', borderRadius: '10px', padding: '12px', marginBottom: '8px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
        <input
          type="date"
          className="cq-input"
          value={t.when}
          onChange={(e) => onChange({ when: e.target.value })}
          aria-label="When"
          style={{ width: '160px', flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Audience options come from "Identify Groups"; keep any legacy free-text value selectable. */}
          <Select
            value={t.audience}
            options={t.audience && !audienceOptions.includes(t.audience) ? [t.audience, ...audienceOptions] : audienceOptions}
            onChange={(v) => onChange({ audience: v })}
            placeholder="Audience"
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ width: '160px', flexShrink: 0 }}>
          <Select value={t.channel} options={channelOptions} onChange={(v) => onChange({ channel: v })} />
        </div>
        <DelButton onClick={onDelete} />
      </div>
      {t.when && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(var(--fg),0.55)', flexShrink: 0 }}>Repeat</span>
          <div style={{ width: '180px' }}>
            <Select
              value={REPEAT_LABELS[t.repeat ?? 'once']}
              options={Object.values(REPEAT_LABELS)}
              onChange={(v) => onChange({ repeat: REPEAT_FROM_LABEL[v] })}
            />
          </div>
        </div>
      )}
      <TextInput value={t.message} onCommit={(v) => onChange({ message: v })} placeholder="Key message: what this audience needs to know" />

      {/* The full drafting helper only makes sense for written email; other channels are spoken/cascaded. */}
      {isWritten && (
        <div style={{ marginTop: '10px' }}>
          <button type="button" style={linkBtnStyle} onClick={() => setOpen((s) => !s)}>
            {open ? '▾ Hide drafting help' : `✍️ ${d.label}`}
          </button>
        </div>
      )}

      {isWritten && open && (
        <div style={{ marginTop: '10px', background: 'rgba(91,134,163,0.06)', border: '1px solid rgba(91,134,163,0.18)', borderRadius: '8px', padding: '14px' }}>
          <div style={{ fontSize: '12px', color: 'rgba(var(--fg),0.6)', lineHeight: 1.6, marginBottom: '12px' }}>{d.why}</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <Label>{d.greetingLabel}</Label>
              <div style={hintStyle}>{d.greetingHint}</div>
              <TextArea value={t.greeting ?? ''} onCommit={(v) => onChange({ greeting: v })} placeholder={d.greetingPlaceholder} rows={2} />
            </div>
            <div>
              <Label>{d.contextLabel}</Label>
              <TextArea value={t.context ?? ''} onCommit={(v) => onChange({ context: v })} placeholder={d.contextPlaceholder} rows={2} />
            </div>
            <div>
              <Label>{d.messageLabel}</Label>
              <TextArea value={t.message} onCommit={(v) => onChange({ message: v })} placeholder={d.messagePlaceholder} rows={2} />
            </div>
            <div>
              <Label>{d.ctaLabel}</Label>
              <TextArea value={t.cta ?? ''} onCommit={(v) => onChange({ cta: v })} placeholder={d.ctaPlaceholder} rows={2} />
            </div>
            <div>
              <Label>{d.closerLabel}</Label>
              <div style={hintStyle}>{d.closerHint}</div>
              <TextArea value={t.closer ?? ''} onCommit={(v) => onChange({ closer: v })} placeholder={d.closerPlaceholder} rows={2} />
            </div>
          </div>

          <div style={{ marginTop: '12px' }}>
            <button type="button" style={fillBtnStyle} onClick={buildDraft}>
              {t.draft ? d.rebuild : d.build}
            </button>
          </div>

          {t.draft != null && t.draft !== '' && (
            <div style={{ marginTop: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <Label>{d.draftLabel}</Label>
                <button type="button" style={linkBtnStyle} onClick={copyDraft}>
                  {copied ? d.copied : d.copy}
                </button>
              </div>
              <TextArea value={t.draft} onCommit={(v) => onChange({ draft: v })} rows={8} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function CommsStage() {
  const { project, data, update } = useStageEditor('comms')
  const schedule = data.schedule ?? []
  const [newChannel, setNewChannel] = useState('')

  // Pull context from earlier stages so the plan builds on what's already there.
  const define = project?.stageData.define
  const groups = project?.stageData.groups.groups ?? []
  const groupNames = groups.map((g) => g.name.trim()).filter(Boolean)
  // Audience dropdown options: the groups identified in "Identify Groups" first,
  // then a few common cross-cutting audiences that aren't usually listed as groups.
  const audienceOptions = [...new Set([...groupNames, 'All staff', 'Managers', 'Leadership team'])]

  // A starting message pre-generated from the user's "Define the Change" answers.
  // Each answer becomes its own paragraph: run together, three separate answers
  // read as one long run-on wall of text that nobody wants to edit.
  const defineSeed = (() => {
    const parts: string[] = []
    if (define?.statement?.trim()) parts.push(define.statement.trim())
    if (define?.whyNow?.trim()) parts.push(define.whyNow.trim())
    if (define?.successLooks?.trim()) parts.push(`What good looks like: ${define.successLooks.trim()}`)
    return parts.join('\n\n')
  })()

  // Default the core message to that pre-generated draft, once, if it's still empty.
  const seededRef = useRef(false)
  useEffect(() => {
    if (!seededRef.current && !data.keyMessages.trim() && defineSeed) {
      seededRef.current = true
      update({ keyMessages: defineSeed })
    }
  }, [data.keyMessages, defineSeed, update])

  // The project's business type tailors the channel options and the example schedule.
  const profile = getBusinessProfile(project?.businessType)
  const activeChannels = profile.channels
  const hasManagerCascade = activeChannels.some((c) => c.name === 'Manager Cascade')
  // Only offer what isn't already on the list; and keep the "best for" guidance
  // for the channels the user has chosen.
  const suggestedChannels = activeChannels.filter((c) => !data.channels.includes(c.name))
  const chosenInfo = activeChannels.filter((c) => data.channels.includes(c.name))

  const toggleChannel = (ch: string) => {
    const cur = new Set(data.channels)
    if (cur.has(ch)) cur.delete(ch)
    else cur.add(ch)
    update({ channels: [...cur] })
  }

  // Let people add their OWN channels — the preset list below is just a starting point, not the whole menu.
  const addCustomChannel = () => {
    const name = newChannel.trim()
    if (name && !data.channels.includes(name)) update({ channels: [...data.channels, name] })
    setNewChannel('')
  }

  const setSchedule = (next: CommsTouchpoint[]) => update({ schedule: next })
  const addTouchpoint = (phase: CommsPhase) =>
    setSchedule([...schedule, { id: uid(), phase, when: '', audience: '', channel: data.channels[0] ?? '', message: '' }])
  // Only offer the channels the user actually selected above, but keep a
  // since-deselected channel visible on a touchpoint that still uses it.
  const channelOptionsFor = (current: string) =>
    current && !data.channels.includes(current) ? [current, ...data.channels] : data.channels
  const setTouchpoint = (id: number, patch: Partial<CommsTouchpoint>) =>
    setSchedule(schedule.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  const delTouchpoint = (id: number) => setSchedule(schedule.filter((t) => t.id !== id))
  const loadExample = () => setSchedule([...schedule, ...profile.examples.comms.schedule.map((e) => ({ ...e, id: uid() }))])

  const steps: WizardStep[] = [
    {
      id: 'keyMessages',
      title: 'Core message',
      isFilled: !!data.keyMessages.trim(),
      // pre-wrap so the paragraph breaks survive into the review read-back
      // instead of collapsing back into one block.
      summary: data.keyMessages ? <span style={{ whiteSpace: 'pre-wrap' }}>{data.keyMessages}</span> : undefined,
      node: (
        <Card>
          <Label>{coaching.comms.fields.keyMessages.label}</Label>
          <div style={{ fontSize: '13px', color: 'rgba(var(--fg),0.55)', lineHeight: 1.6, margin: '2px 0 14px' }}>
            {defineSeed
              ? 'We’ve drafted a starting message from your “Define the Change” answers. Read it over, make it sound like you, and edit anything that’s off before you move ahead.'
              : 'Write the one message everyone needs to walk away with. Keep it plain and short enough to repeat, then review it before you move ahead.'}
          </div>
          <TextArea value={data.keyMessages} onCommit={(v) => update({ keyMessages: v })} placeholder="What must people understand, believe, and feel?" rows={16} />
        </Card>
      ),
    },
    {
      id: 'channels',
      title: 'Channels',
      isFilled: data.channels.length > 0,
      summary: data.channels.length ? data.channels.join(', ') : undefined,
      node: (
      <Card>
        <Label>Communication channels</Label>
        <div style={{ fontSize: '13px', color: 'rgba(var(--fg),0.55)', lineHeight: 1.6, margin: '2px 0 14px' }}>
          How will you get the word out? Add the channels your organization actually uses, whatever you call them. Most
          changes need a few working together.
        </div>

        {/* Add your own channels first — don’t lock people into our preset list. */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: data.channels.length ? '14px' : '18px' }}>
          <input
            className="cq-input"
            value={newChannel}
            onChange={(e) => setNewChannel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustomChannel()
              }
            }}
            placeholder="Add a channel. Example: Town hall, Slack, Team huddle"
            aria-label="Add a communication channel"
            style={{ flex: 1 }}
          />
          <button type="button" style={fillBtnStyle} onClick={addCustomChannel} disabled={!newChannel.trim()}>
            Add
          </button>
        </div>

        {/* Everything chosen so far — custom or tapped from the suggestions below — each removable. */}
        {data.channels.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
            {data.channels.map((name) => (
              <span
                key={name}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text)',
                  background: 'rgba(91,134,163,0.14)',
                  border: '1px solid rgba(91,134,163,0.3)',
                  borderRadius: '999px',
                  padding: '5px 6px 5px 13px',
                }}
              >
                {name}
                <button
                  type="button"
                  onClick={() => toggleChannel(name)}
                  aria-label={`Remove ${name}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(var(--fg),0.1)',
                    color: 'rgba(var(--fg),0.7)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    lineHeight: 1,
                    fontFamily: 'inherit',
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* The preset list for this business type, as an add-one dropdown. Picking
            a channel adds it to the chips above and the select resets, so it
            always reads as an "add" control rather than a field holding a value.
            Already-chosen channels drop out of the list. */}
        {suggestedChannels.length > 0 && (
          <select
            className="cq-select"
            value=""
            onChange={(e) => {
              if (e.target.value) toggleChannel(e.target.value)
            }}
          >
            <option value="">Add a common channel…</option>
            {suggestedChannels.map((ch) => (
              <option key={ch.name} value={ch.name}>{ch.name}</option>
            ))}
          </select>
        )}
        {/* The channel cards carried a "best for" line each; keep that coaching
            for whatever the user has actually picked, now that the cards are gone. */}
        {chosenInfo.length > 0 && (
          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {chosenInfo.map((ch) => (
              <div key={ch.name} style={{ fontSize: '12.5px', color: 'rgba(var(--fg),0.65)', lineHeight: 1.5 }}>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>{ch.name}:</span>{' '}
                <span style={{ fontWeight: 600, color: 'var(--accent-text)' }}>best for</span> {ch.best}
              </div>
            ))}
          </div>
        )}
        {hasManagerCascade && !data.channels.includes('Manager Cascade') && (
          <InsightCallout tone={coaching.comms.managerCascade.tone} style={{ marginTop: '12px' }}>
            {coaching.comms.managerCascade.text}
          </InsightCallout>
        )}
        {data.channels.length === 1 && /email/i.test(data.channels[0]) && (
          <InsightCallout tone={coaching.comms.emailOnly.tone} style={{ marginTop: '12px' }}>
            {coaching.comms.emailOnly.text}
          </InsightCallout>
        )}
      </Card>
      ),
    },
    {
      id: 'schedule',
      title: 'Schedule',
      isFilled: schedule.length > 0,
      summary: schedule.length ? `${schedule.length} touchpoint${schedule.length === 1 ? '' : 's'} planned` : undefined,
      node: (
      <Card>
        <Label>{coaching.comms.schedule.label}</Label>

        {groupNames.length > 0 && (
          <div style={{ background: 'rgba(91,134,163,0.08)', border: '1px solid rgba(91,134,163,0.22)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent-text)', marginBottom: '8px' }}>
              Audiences to cover (from “Identify Groups”)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {groupNames.map((name) => (
                <span key={name} style={{ fontSize: '12.5px', color: 'rgba(var(--fg),0.8)', background: 'rgba(91,134,163,0.14)', border: '1px solid rgba(91,134,163,0.25)', borderRadius: '999px', padding: '4px 11px' }}>
                  {name}
                </span>
              ))}
            </div>
            <div style={{ fontSize: '11.5px', color: 'rgba(var(--fg),0.45)', marginTop: '9px', lineHeight: 1.5 }}>
              Make sure each of these hears from you. Pick them from the Audience dropdown on each touchpoint below.
            </div>
          </div>
        )}

        {data.channels.length === 0 && (
          <InsightCallout tone="info" style={{ marginBottom: '16px' }}>
            Pick your channels above first, each touchpoint’s channel dropdown only offers the channels you’ve chosen.
          </InsightCallout>
        )}

        {PHASES.map((phase) => {
          const meta = coaching.comms.schedule.phases[phase]
          const items = schedule.filter((t) => t.phase === phase)
          return (
            <div key={phase} style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-text)', textTransform: 'uppercase', letterSpacing: '1px' }}>{meta.label}</div>
              <div style={{ fontSize: '11px', color: 'rgba(var(--fg),0.4)', margin: '3px 0 10px', lineHeight: 1.5 }}>{meta.hint}</div>

              {items.map((t) => (
                <TouchpointCard
                  key={t.id}
                  t={t}
                  channelOptions={channelOptionsFor(t.channel)}
                  audienceOptions={audienceOptions}
                  onChange={(patch) => setTouchpoint(t.id, patch)}
                  onDelete={() => delTouchpoint(t.id)}
                />
              ))}

              <AddButton label="+ Add touchpoint" onClick={() => addTouchpoint(phase)} />
            </div>
          )
        })}

        {schedule.length === 0 && (
          <button
            type="button"
            onClick={loadExample}
            style={{ background: 'rgba(91,134,163,0.15)', border: '1px solid rgba(91,134,163,0.35)', borderRadius: '6px', padding: '8px 14px', color: 'var(--accent-text)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Load an example schedule →
          </button>
        )}
      </Card>
      ),
    },
  ]

  return <StageFlow stageId="comms" icon={coaching.comms.icon} blurb={coaching.comms.intro} steps={steps} guidance={false} />
}
