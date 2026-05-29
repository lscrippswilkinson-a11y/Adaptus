import { useStageEditor } from '@/state/AppContext'
import { FieldCoach, StageIntro, TextArea } from '@/components/ui'
import { TipBox } from '@/components/TipBox'
import { coaching } from '@/data/coaching'

export function CloseoutStage() {
  const { data, update } = useStageEditor('closeout')
  return (
    <>
      <StageIntro icon={coaching.closeout.icon}>{coaching.closeout.intro}</StageIntro>
      <TipBox stageId="closeout" />

      <div
        style={{
          background: 'rgba(91,134,163,0.1)',
          border: '1px solid rgba(91,134,163,0.2)',
          borderRadius: '14px',
          padding: '22px 26px',
          marginBottom: '14px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '36px', marginBottom: '8px' }}>🏆</div>
        <div style={{ fontSize: '17px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>{coaching.closeout.banner.title}</div>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
          {coaching.closeout.banner.body}
        </div>
      </div>

      <FieldCoach
        label={coaching.closeout.fields.wins.label}
        why={coaching.closeout.fields.wins.why}
        example={coaching.closeout.fields.wins.example}
        onUseExample={() => update({ wins: coaching.closeout.fields.wins.example })}
      >
        <TextArea value={data.wins} onCommit={(v) => update({ wins: v })} placeholder="What worked? What would you repeat?" rows={4} />
      </FieldCoach>

      <FieldCoach
        label={coaching.closeout.fields.lessons.label}
        why={coaching.closeout.fields.lessons.why}
        example={coaching.closeout.fields.lessons.example}
        onUseExample={() => update({ lessons: coaching.closeout.fields.lessons.example })}
      >
        <TextArea value={data.lessons} onCommit={(v) => update({ lessons: v })} placeholder="What would you do differently?" rows={4} />
      </FieldCoach>

      <FieldCoach
        label={coaching.closeout.fields.shoutouts.label}
        why={coaching.closeout.fields.shoutouts.why}
        example={coaching.closeout.fields.shoutouts.example}
        onUseExample={() => update({ shoutouts: coaching.closeout.fields.shoutouts.example })}
      >
        <TextArea value={data.shoutouts} onCommit={(v) => update({ shoutouts: v })} placeholder="Name the people who went above and beyond." rows={3} />
      </FieldCoach>
    </>
  )
}
