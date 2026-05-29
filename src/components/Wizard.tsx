import { useState } from 'react'
import { CHANGE_TYPES } from '@/data/constants'

export interface ProjectDraft {
  name: string
  type: string
  description: string
  targetDate: string
}

const STEPS = [
  { title: 'Name your change initiative', sub: 'Give it an identity.' },
  { title: 'Describe the change', sub: "What's really happening here?" },
  { title: 'Set your target timeline', sub: 'When do you need this done?' },
]

const sideBtn: React.CSSProperties = {
  flex: 1,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  padding: '12px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '14px',
}

export function Wizard({ onClose, onCreate }: { onClose: () => void; onCreate: (draft: ProjectDraft) => void }) {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<ProjectDraft>({ name: '', type: '', description: '', targetDate: '' })

  const isValid =
    step === 0 ? draft.name.trim().length > 0 && draft.type.length > 0 : step === 1 ? draft.description.trim().length > 0 : true

  const next = () => {
    if (!isValid) return
    if (step < STEPS.length - 1) setStep(step + 1)
    else onCreate(draft)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,20,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#13132b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '36px 44px', width: '500px', maxWidth: '90vw' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '26px' }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= step ? '#5B86A3' : 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>

        <div style={{ fontSize: '11px', color: '#5B86A3', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
          Step {step + 1} of {STEPS.length}
        </div>
        <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: '#fff' }}>{STEPS[step].title}</h2>
        <p style={{ margin: '0 0 22px', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>{STEPS[step].sub}</p>

        {step === 0 && (
          <>
            <div className="cq-lbl">Project name</div>
            <input
              type="text"
              className="cq-input"
              autoFocus
              value={draft.name}
              placeholder="e.g., Salesforce CRM Rollout Q3"
              style={{ marginBottom: '18px' }}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
            <div className="cq-lbl">Change type</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
              {CHANGE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={'ch-btn' + (draft.type === t ? ' sel' : '')}
                  style={{ fontSize: '12px' }}
                  onClick={() => setDraft({ ...draft, type: t })}
                >
                  {t}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="cq-lbl">Brief description</div>
            <textarea
              className="cq-textarea"
              autoFocus
              rows={5}
              value={draft.description}
              placeholder="What are you changing? Who's affected? What's the goal?"
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </>
        )}

        {step === 2 && (
          <>
            <div className="cq-lbl">Target completion date (optional)</div>
            <input
              type="date"
              className="cq-input"
              style={{ maxWidth: '200px' }}
              value={draft.targetDate}
              onChange={(e) => setDraft({ ...draft, targetDate: e.target.value })}
            />
            <div style={{ marginTop: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.7 }}>
              Guided roadmap for <strong style={{ color: 'rgba(255,255,255,0.6)' }}>{draft.name}</strong>. 13 stages. Step by step.
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '26px' }}>
          <button type="button" style={{ ...sideBtn, color: 'rgba(255,255,255,0.4)' }} onClick={onClose}>
            Cancel
          </button>
          {step > 0 && (
            <button type="button" style={{ ...sideBtn, color: 'rgba(255,255,255,0.6)' }} onClick={() => setStep(step - 1)}>
              ← Back
            </button>
          )}
          <button
            type="button"
            onClick={next}
            style={{
              flex: 2,
              border: 'none',
              borderRadius: '10px',
              padding: '12px',
              fontWeight: 700,
              fontSize: '14px',
              fontFamily: 'inherit',
              background: isValid ? 'linear-gradient(135deg,#5B86A3,#3E6580)' : 'rgba(91,134,163,0.2)',
              color: isValid ? '#fff' : 'rgba(255,255,255,0.3)',
              cursor: isValid ? 'pointer' : 'default',
            }}
          >
            {step < STEPS.length - 1 ? 'Continue →' : '🚀 Launch Project'}
          </button>
        </div>
      </div>
    </div>
  )
}
