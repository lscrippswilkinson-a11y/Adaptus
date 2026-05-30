import { useStageEditor } from '@/state/AppContext'
import type { CommsPhase, CommsTouchpoint } from '@/types'
import { AddButton, Card, DelButton, FieldCoach, InsightCallout, Label, Select, StageIntro, TextArea, TextInput } from '@/components/ui'
import { TipBox } from '@/components/TipBox'
import { CHANNELS } from '@/data/constants'
import { coaching } from '@/data/coaching'
import { uid } from '@/lib/id'

const PHASES: CommsPhase[] = ['before', 'launch', 'after']

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
                <div key={t.id} style={{ background: 'rgba(var(--fg),0.03)', border: '1px solid rgba(var(--fg),0.07)', borderRadius: '10px', padding: '12px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <TextInput value={t.when} onCommit={(v) => setTouchpoint(t.id, { when: v })} placeholder="When (e.g., 2 weeks out)" style={{ width: '150px', flexShrink: 0 }} />
                    <TextInput value={t.audience} onCommit={(v) => setTouchpoint(t.id, { audience: v })} placeholder="Audience" style={{ flex: 1, minWidth: 0 }} />
                    <div style={{ width: '160px', flexShrink: 0 }}>
                      <Select value={t.channel} options={channelOptionsFor(t.channel)} onChange={(v) => setTouchpoint(t.id, { channel: v })} />
                    </div>
                    <DelButton onClick={() => delTouchpoint(t.id)} />
                  </div>
                  <TextInput value={t.message} onCommit={(v) => setTouchpoint(t.id, { message: v })} placeholder="Key message — what this audience needs to know" />
                </div>
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
