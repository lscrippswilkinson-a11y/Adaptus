import { useState } from 'react'
import { Rocket, X } from 'lucide-react'

export interface ProjectDraft {
  name: string
  type: string
  description: string
  targetDate: string
}

export function Wizard({ onClose, onCreate }: { onClose: () => void; onCreate: (draft: ProjectDraft) => void }) {
  const [draft, setDraft] = useState<ProjectDraft>({ name: '', type: '', description: '', targetDate: '' })

  const isValid = draft.name.trim().length > 0

  const create = () => {
    if (!isValid) return
    onCreate(draft)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,20,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ position: 'relative', background: 'var(--surface-card)', border: '1px solid rgba(var(--fg),0.08)', borderRadius: '20px', padding: '36px 44px', width: '500px', maxWidth: '90vw' }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{ position: 'absolute', top: '18px', right: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: 'transparent', border: 'none', color: 'rgba(var(--fg),0.45)', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <X size={18} />
        </button>

        <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>Name your change initiative</h2>
        <p style={{ margin: '0 0 22px', color: 'rgba(var(--fg),0.4)', fontSize: '14px' }}>Give it an identity.</p>

        <div className="cq-lbl">Project name</div>
        <input
          type="text"
          className="cq-input"
          autoFocus
          value={draft.name}
          placeholder="e.g., Salesforce CRM Rollout Q3"
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') create()
          }}
        />

        <div style={{ display: 'flex', marginTop: '26px' }}>
          <button
            type="button"
            onClick={create}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              border: 'none',
              borderRadius: '10px',
              padding: '12px',
              fontWeight: 700,
              fontSize: '14px',
              fontFamily: 'inherit',
              background: isValid ? 'linear-gradient(135deg,#5B86A3,#3E6580)' : 'rgba(91,134,163,0.2)',
              color: isValid ? 'var(--on-accent)' : 'rgba(var(--fg),0.3)',
              cursor: isValid ? 'pointer' : 'default',
            }}
          >
            <Rocket size={16} /> Launch project
          </button>
        </div>
      </div>
    </div>
  )
}
