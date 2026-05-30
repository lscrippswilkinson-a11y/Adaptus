import { useState } from 'react'
import { useStageEditor } from '@/state/AppContext'
import type { CommsPhase, CommsTouchpoint } from '@/types'
import { AddButton, Card, DelButton, FieldCoach, InsightCallout, Label, Select, StageIntro, TextArea, TextInput } from '@/components/ui'
import { TipBox } from '@/components/TipBox'
import { CHANNELS } from '@/data/constants'
import { coaching } from '@/data/coaching'
import { uid } from '@/lib/id'

const PHASES: CommsPhase[] = ['before', 'launch', 'after']

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
 * expandable drafter that coaches an effective message — context, core
 * message, and a clear call to action — and assembles a copy-ready draft.
 */
function TouchpointCard({
  t,
  channelOptions,
  onChange,
  onDelete,
}: {
  t: CommsTouchpoint
  channelOptions: string[]
  onChange: (patch: Partial<CommsTouchpoint>) => void
  onDelete: () => void
}) {
  const d = coaching.comms.draft
  // Open by default if the user has already started drafting this one.
  const [open, setOpen] = useState(!!(t.context || t.cta || t.draft))
  const [copied, setCopied] = useState(false)

  const buildDraft = () =>
    onChange({ draft: d.assemble({ audience: t.audience, context: t.context, message: t.message, cta: t.cta }) })

  const copyDraft = async () => {
    if (!t.draft) return
    try {
      await navigator.clipboard.writeText(t.draft)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked — the text is still selectable in the field */
    }
  }

  return (
    <div style={{ background: 'rgba(var(--fg),0.03)', border: '1px solid rgba(var(--fg),0.07)', borderRadius: '10px', padding: '12px', marginBottom: '8px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
        <TextInput value={t.when} onCommit={(v) => onChange({ when: v })} placeholder="When (e.g., 2 weeks out)" style={{ width: '150px', flexShrink: 0 }} />
        <TextInput value={t.audience} onCommit={(v) => onChange({ audience: v })} placeholder="Audience" style={{ flex: 1, minWidth: 0 }} />
        <div style={{ width: '160px', flexShrink: 0 }}>
          <Select value={t.channel} options={channelOptions} onChange={(v) => onChange({ channel: v })} />
        </div>
        <DelButton onClick={onDelete} />
      </div>
      <TextInput value={t.message} onCommit={(v) => onChange({ message: v })} placeholder="Key message — what this audience needs to know" />

      <div style={{ marginTop: '10px' }}>
        <button type="button" style={linkBtnStyle} onClick={() => setOpen((s) => !s)}>
          {open ? '▾ Hide drafting help' : `✍️ ${d.label}`}
        </button>
      </div>

      {open && (
        <div style={{ marginTop: '10px', background: 'rgba(91,134,163,0.06)', border: '1px solid rgba(91,134,163,0.18)', borderRadius: '8px', padding: '14px' }}>
          <div style={{ fontSize: '12px', color: 'rgba(var(--fg),0.6)', lineHeight: 1.6, marginBottom: '12px' }}>{d.why}</div>

          <ul style={{ margin: '0 0 14px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {d.anatomy.map((a) => (
              <li key={a.k} style={{ fontSize: '12px', lineHeight: 1.55, color: 'rgba(var(--fg),0.7)' }}>
                <span style={{ fontWeight: 700, color: 'var(--accent-text)' }}>{a.k}.</span> {a.t}
              </li>
            ))}
          </ul>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
  const { data, update } = useStageEditor('comms')
  const schedule = data.schedule ?? []

  const toggleChannel = (ch: string) => {
    const cur = new Set(data.channels)
    if (cur.has(ch)) cur.delete(ch)
    else cur.add(ch)
    update({ channels: [...cur] })
  }

  const setSchedule = (next: CommsTouchpoint[]) => update({ schedule: next })
  const addTouchpoint = (phase: CommsPhase) =>
    setSchedule([...schedule, { id: uid(), phase, when: '', audience: '', channel: data.channels[0] ?? '', message: '' }])
  // Only offer the channels the user actually selected above — but keep a
  // since-deselected channel visible on a touchpoint that still uses it.
  const channelOptionsFor = (current: string) =>
    current && !data.channels.includes(current) ? [current, ...data.channels] : data.channels
  const setTouchpoint = (id: number, patch: Partial<CommsTouchpoint>) =>
    setSchedule(schedule.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  const delTouchpoint = (id: number) => setSchedule(schedule.filter((t) => t.id !== id))
  const loadExample = () => setSchedule([...schedule, ...coaching.comms.schedule.example.map((e) => ({ ...e, id: uid() }))])

  return (
    <>
      <StageIntro icon={coaching.comms.icon}>{coaching.comms.intro}</StageIntro>
      <TipBox stageId="comms" />

      <FieldCoach
        label={coaching.comms.fields.keyMessages.label}
        why={coaching.comms.fields.keyMessages.why}
        example={coaching.comms.fields.keyMessages.example}
        onUseExample={() => update({ keyMessages: coaching.comms.fields.keyMessages.example })}
      >
        <TextArea value={data.keyMessages} onCommit={(v) => update({ keyMessages: v })} placeholder="What must people understand, believe, and feel?" rows={3} />
      </FieldCoach>

      <Card>
        <Label>Communication channels</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
          {CHANNELS.map((ch) => (
            <button
              key={ch}
              type="button"
              className={'ch-btn' + (data.channels.includes(ch) ? ' sel' : '')}
              onClick={() => toggleChannel(ch)}
            >
              {ch}
            </button>
          ))}
        </div>
        {!data.channels.includes('Manager Cascade') && (
          <InsightCallout tone={coaching.comms.managerCascade.tone} style={{ marginTop: '12px' }}>
            {coaching.comms.managerCascade.text}
          </InsightCallout>
        )}
        {data.channels.length === 1 && data.channels[0] === 'Email Blast' && (
          <InsightCallout tone={coaching.comms.emailOnly.tone} style={{ marginTop: '12px' }}>
            {coaching.comms.emailOnly.text}
          </InsightCallout>
        )}
      </Card>

      {/* Structured, phased communication schedule */}
      <Card>
        <Label>{coaching.comms.schedule.label}</Label>
        <div style={{ fontSize: '13px', color: 'rgba(var(--fg),0.55)', lineHeight: 1.6, margin: '0 0 16px' }}>
          {coaching.comms.schedule.why}
        </div>

        {data.channels.length === 0 && (
          <InsightCallout tone="info" style={{ marginBottom: '16px' }}>
            Pick your channels above first — each touchpoint’s channel dropdown only offers the channels you’ve chosen.
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
    </>
  )
}
